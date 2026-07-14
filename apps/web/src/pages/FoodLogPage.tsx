import { useState, useRef } from 'react';
import { Input, InputNumber, Select, Button, Checkbox, message, Typography, Modal, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useFoodLogs, useCreateFoodLog, useDeleteFoodLog } from '../hooks/useFoodLogs';
import { useFoodSearch, useCreateFood } from '../hooks/useFoods';
import { useGeminiNutrition } from '../hooks/useGeminiNutrition';
import { Card, Field } from '../components/ui';
import { PortionChatBot } from '../components/PortionChatBot';
import type { CreateFoodLogInput, Food } from '@health-tracker/shared';
import { formatKcal, todayISO } from '../lib/format';

const { Text } = Typography;

type MacroKey = 'calories' | 'protein_g' | 'carbs_g' | 'fat_g';

interface FormState {
  meal_type: CreateFoodLogInput['meal_type'];
  food_name: string;
  quantity_g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

const DEFAULT_FORM: FormState = {
  meal_type: 'breakfast',
  food_name: '',
  quantity_g: 100,
  calories: 0,
  protein_g: 0,
  carbs_g: 0,
  fat_g: 0,
};

const round1 = (n: number) => Math.round(n * 10) / 10;

const PER_100G: Record<MacroKey, keyof Food> = {
  calories: 'kcal_per_100g',
  protein_g: 'protein_per_100g',
  carbs_g: 'carbs_per_100g',
  fat_g: 'fat_per_100g',
};

function scaleMacros(
  food: Food,
  qty: number,
  current: FormState,
  manual: Record<MacroKey, boolean>,
): Partial<FormState> {
  const factor = qty / 100;
  const out: Partial<FormState> = {};
  (Object.keys(PER_100G) as MacroKey[]).forEach((k) => {
    out[k] = manual[k] ? current[k] : round1((food[PER_100G[k]] as number) * factor);
  });
  return out;
}

export function FoodLogPage() {
  const { userId } = useCurrentUser();
  const [date, setDate] = useState(todayISO());
  const { data: foods } = useFoodLogs(userId, date);
  const createLog = useCreateFoodLog(userId);
  const remove = useDeleteFoodLog(userId);
  const createFood = useCreateFood();
  const gemini = useGeminiNutrition();

  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [saveNew, setSaveNew] = useState(false);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [manual, setManual] = useState<Record<MacroKey, boolean>>({
    calories: false,
    protein_g: false,
    carbs_g: false,
    fat_g: false,
  });
  const [flash, setFlash] = useState(false);
  const flashTimer = useRef<number>();
  const [aiLoading, setAiLoading] = useState(false);

  function flashNow() {
    setFlash(true);
    window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(false), 450);
  }

  function applyFood(food: Food) {
    setSelectedFood(food);
    setManual({ calories: false, protein_g: false, carbs_g: false, fat_g: false });
    setForm((prev) => ({
      ...prev,
      food_name: food.name,
      ...scaleMacros(food, prev.quantity_g, prev, {
        calories: false,
        protein_g: false,
        carbs_g: false,
        fat_g: false,
      }),
    }));
    flashNow();
  }

  function onQuantity(v: number) {
    setForm((prev) =>
      selectedFood
        ? { ...prev, quantity_g: v, ...scaleMacros(selectedFood, v, prev, manual) }
        : { ...prev, quantity_g: v },
    );
    if (selectedFood && !Object.values(manual).every(Boolean)) flashNow();
  }

  function onMacro(k: MacroKey, v: number) {
    setForm((prev) => ({ ...prev, [k]: v }));
    setManual((m) => ({ ...m, [k]: true }));
  }

  function resetAuto(k: MacroKey) {
    if (!selectedFood) return;
    setManual((m) => ({ ...m, [k]: false }));
    setForm((prev) => ({
      ...prev,
      [k]: round1((selectedFood[PER_100G[k]] as number) * (prev.quantity_g / 100)),
    }));
    flashNow();
  }

  function resetForm() {
    setSelectedFood(null);
    setSaveNew(false);
    setManual({ calories: false, protein_g: false, carbs_g: false, fat_g: false });
    setForm(DEFAULT_FORM);
  }

  const qtyValid = form.quantity_g > 0;
  const nameValid = form.food_name.trim().length > 0;
  const enoughData = selectedFood != null || form.calories > 0;
  const canSubmit = nameValid && qtyValid && enoughData;

  if (userId == null) return <Card>Vui lòng chọn hồ sơ ở trang Hồ sơ trước.</Card>;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    const payload: Omit<CreateFoodLogInput, 'log_date'> = {
      meal_type: form.meal_type,
      food_name: form.food_name.trim(),
      quantity_g: form.quantity_g,
      calories: form.calories,
      protein_g: form.protein_g,
      carbs_g: form.carbs_g,
      fat_g: form.fat_g,
    };

    const finish = () => {
      createLog.mutate({ ...payload, log_date: date });
      message.success('Đã thêm món ăn thành công!');
      resetForm();
      setAddModalOpen(false);
    };

    if (saveNew && payload.food_name) {
      createFood.mutate(
        {
          name: payload.food_name,
          kcal_per_100g: payload.calories,
          protein_per_100g: payload.protein_g,
          carbs_per_100g: payload.carbs_g,
          fat_per_100g: payload.fat_g,
        },
        { onSuccess: finish, onError: finish },
      );
    } else {
      finish();
    }
  }

  const openAddModal = () => {
    resetForm();
    setAddModalOpen(true);
  };

  const closeAddModal = () => {
    setAddModalOpen(false);
    resetForm();
  };

  const handleAiEstimate = async () => {
    const foodName = form.food_name.trim();
    if (!foodName) {
      message.warning('Vui lòng nhập tên món ăn trước');
      return;
    }
    setAiLoading(true);
    try {
      const estimate = await gemini.mutateAsync(foodName);
      const factor = form.quantity_g / 100;
      setForm((prev) => ({
        ...prev,
        food_name: estimate.food_name,
        calories: round1(estimate.kcal_per_100g * factor),
        protein_g: round1(estimate.protein_per_100g * factor),
        carbs_g: round1(estimate.carbs_per_100g * factor),
        fat_g: round1(estimate.fat_per_100g * factor),
      }));
      setManual({ calories: false, protein_g: false, carbs_g: false, fat_g: false });
      flashNow();
      message.success('Đã ước lượng dinh dưỡng bằng AI!');
    } catch (err) {
      message.error((err as Error).message);
    } finally {
      setAiLoading(false);
    }
  };

  const flashCls = `transition-all duration-300 ${flash ? '!bg-emerald-50 !border-emerald-300' : '!bg-white'}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Nhật ký ăn uống</h1>
        <DatePicker
          value={dayjs(date)}
          onChange={(d) => setDate(d ? d.format('YYYY-MM-DD') : '')}
          className="!w-auto"
          format="YYYY-MM-DD"
        />
      </div>

      <Card className="!rounded-2xl" title={<span className="text-lg font-semibold">Thêm món ăn</span>}>
        <form className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" onSubmit={onSubmit}>
          <Field label="Bữa">
            <Select
              value={form.meal_type}
              onChange={(v) => setForm({ ...form, meal_type: v as FormState['meal_type'] })}
              options={[
                { value: 'breakfast', label: 'Sáng' },
                { value: 'lunch', label: 'Trưa' },
                { value: 'dinner', label: 'Tối' },
                { value: 'snack', label: 'Ăn vặt' },
              ]}
              className="!rounded-xl"
            />
          </Field>

          <div className="lg:col-span-2">
            <Field label="Tên món">
              <div className="flex gap-2">
                <FoodSearchSelect
                  value={form.food_name}
                  onChange={(name) => {
                    setSelectedFood(null);
                    setForm((f) => ({ ...f, food_name: name }));
                  }}
                  onSelect={applyFood}
                />
                <Button
                  type="default"
                  size="small"
                  onClick={openAddModal}
                  className="!rounded-xl !whitespace-nowrap"
                >
                  ＋ Mới
                </Button>
              </div>
            </Field>
          </div>

          <Field label="Khối lượng (g)">
            <InputNumber
              min={1}
              value={form.quantity_g}
              onChange={(v) => onQuantity(Number(v))}
              className="!w-full !rounded-xl"
              controls={false}
            />
          </Field>

          <MacroField
            label="Kcal"
            k="calories"
            value={form.calories}
            manual={manual.calories}
            flashCls={flashCls}
            onChange={onMacro}
            onReset={resetAuto}
          />
          <MacroField
            label="Protein (g)"
            k="protein_g"
            value={form.protein_g}
            manual={manual.protein_g}
            flashCls={flashCls}
            onChange={onMacro}
            onReset={resetAuto}
          />
          <MacroField
            label="Carbs (g)"
            k="carbs_g"
            value={form.carbs_g}
            manual={manual.carbs_g}
            flashCls={flashCls}
            onChange={onMacro}
            onReset={resetAuto}
          />
          <MacroField
            label="Fat (g)"
            k="fat_g"
            value={form.fat_g}
            manual={manual.fat_g}
            flashCls={flashCls}
            onChange={onMacro}
            onReset={resetAuto}
          />

          <div className="col-span-1 flex items-end sm:col-span-2 lg:col-span-4">
            <Button type="primary" htmlType="submit" disabled={!canSubmit} size="large" className="!rounded-xl">
              Thêm
            </Button>
          </div>
        </form>

        {!canSubmit && (
          <p className="mt-3 text-sm text-rose-500">
            Vui lòng chọn/khai báo món, nhập khối lượng &gt; 0 và chỉ số dinh dưỡng hợp lệ.
          </p>
        )}
        {createLog.isError && (
          <p className="mt-2 text-sm text-rose-500">{(createLog.error as Error).message}</p>
        )}
      </Card>

      <Modal
        title="Thêm món ăn mới"
        open={addModalOpen}
        onCancel={closeAddModal}
        footer={null}
        width={600}
      >
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-slate-700">Tên món</label>
              <Input
                placeholder="Nhập tên món…"
                value={form.food_name}
                onChange={(e) => setForm({ ...form, food_name: e.target.value })}
                className="!rounded-xl"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="primary"
                onClick={handleAiEstimate}
                loading={aiLoading}
                className="!rounded-xl !whitespace-nowrap"
              >
                ✨ AI
              </Button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Khối lượng (g)</label>
            <InputNumber
              min={1}
              value={form.quantity_g}
              onChange={(v) => onQuantity(Number(v))}
              className="!w-full !rounded-xl"
              controls={false}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <MacroField label="Kcal" k="calories" value={form.calories} manual={manual.calories} flashCls={flashCls} onChange={onMacro} onReset={resetAuto} />
            <MacroField label="Protein (g)" k="protein_g" value={form.protein_g} manual={manual.protein_g} flashCls={flashCls} onChange={onMacro} onReset={resetAuto} />
            <MacroField label="Carbs (g)" k="carbs_g" value={form.carbs_g} manual={manual.carbs_g} flashCls={flashCls} onChange={onMacro} onReset={resetAuto} />
            <MacroField label="Fat (g)" k="fat_g" value={form.fat_g} manual={manual.fat_g} flashCls={flashCls} onChange={onMacro} onReset={resetAuto} />
          </div>

          <Checkbox checked={saveNew} onChange={(e) => setSaveNew(e.target.checked)}>
            <span className="text-sm text-slate-600">Lưu món này vào danh sách để dùng lại lần sau</span>
          </Checkbox>

          <div className="flex justify-end gap-2">
            <Button onClick={closeAddModal}>Hủy</Button>
            <Button type="primary" htmlType="submit" disabled={!canSubmit} loading={createLog.isPending}>
              Thêm
            </Button>
          </div>

          {!canSubmit && (
            <p className="text-sm text-rose-500">
              Vui lòng nhập tên món, khối lượng &gt; 0 và chỉ số dinh dưỡng hợp lệ.
            </p>
          )}
        </form>
      </Modal>

      <Card className="!rounded-2xl" title={<span className="text-lg font-semibold">Danh sách ({formatKcal(foods?.length ?? 0)} món)</span>}>
        {foods?.length === 0 && <Text type="secondary">Chưa có món nào.</Text>}
        <div className="space-y-3">
          {foods?.map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3">
              <div>
                <Text strong>{f.food_name}</Text>
                <div className="text-xs text-slate-500">
                  {f.meal_type} · {f.quantity_g}g
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Text className="font-semibold text-emerald-600">{formatKcal(f.calories)} Kcal</Text>
                <Button
                  type="text"
                  danger
                  size="small"
                  onClick={() => remove.mutate(f.id)}
                  className="!text-rose-600"
                >
                  Xóa
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <PortionChatBot
        foodName={form.food_name}
        onApplyQuantity={(g) => onQuantity(g)}
      />
    </div>
  );
}

function MacroField({
  label,
  k,
  value,
  manual,
  flashCls,
  onChange,
  onReset,
}: {
  label: string;
  k: MacroKey;
  value: number;
  manual: boolean;
  flashCls: string;
  onChange: (k: MacroKey, v: number) => void;
  onReset: (k: MacroKey) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <span className={`text-[10px] ${manual ? 'text-slate-400' : 'text-emerald-500'}`}>
          {manual ? 'đã chỉnh tay' : 'tự động'}
          {manual && (
            <button type="button" className="ml-1 underline" onClick={() => onReset(k)}>
              ↺
            </button>
          )}
        </span>
      </div>
      <Input
        type="number"
        className={`!rounded-xl ${flashCls}`}
        value={value}
        onChange={(e) => onChange(k, Number(e.target.value))}
      />
    </div>
  );
}

function FoodSearchSelect({
  value,
  onChange,
  onSelect,
}: {
  value: string;
  onChange: (name: string) => void;
  onSelect: (food: Food) => void;
}) {
  const [search, setSearch] = useState('');
  const { data: results = [], isFetching } = useFoodSearch(search);

  const options = results.map((food) => ({
    value: food.name,
    label: (
      <div className="flex items-center justify-between">
        <span>{food.name}</span>
        <span className="text-xs text-slate-400">{Math.round(food.kcal_per_100g)} Kcal/100g</span>
      </div>
    ),
  }));

  return (
    <Select
      showSearch
      value={value}
      placeholder="Tìm món ăn..."
      className="!w-full !rounded-xl"
      defaultActiveFirstOption={false}
      showArrow={false}
      filterOption={false}
      onSearch={setSearch}
      onChange={(v) => {
        onChange(v);
        const found = results.find((r) => r.name === v);
        if (found) onSelect(found);
      }}
      options={options}
      notFoundContent={isFetching ? 'Đang tìm...' : 'Không tìm thấy. Thử từ khóa khác.'}
    />
  );
}

