import { apiClient } from '../api/client';
import { useMemo, useState, useEffect } from 'react';
import { Card, Progress, Statistic, Typography, Tag, Space, DatePicker, Select, InputNumber, Button, message, Modal, Spin } from 'antd';
import dayjs from 'dayjs';
import { FireOutlined, ClockCircleOutlined, PlusOutlined, RobotOutlined } from '@ant-design/icons';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useUser } from '../hooks/useUsers';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useDailyLog } from '../hooks/useDailyLogs';
import { useFoodLogs, useCreateFoodLog } from '../hooks/useFoodLogs';
import { useFoodSearch } from '../hooks/useFoods';
import { formatKcal, todayISO } from '../lib/format';
import type { Food, CreateFoodLogInput } from '@health-tracker/shared';

const { Title, Text } = Typography;

const MEAL_TYPE_OPTIONS: { value: CreateFoodLogInput['meal_type']; label: string }[] = [
  { value: 'breakfast', label: 'Sáng' },
  { value: 'lunch', label: 'Trưa' },
  { value: 'dinner', label: 'Tối' },
  { value: 'snack', label: 'Ăn vặt' },
];

const MACRO_COLORS: Record<string, string> = {
  protein: '#10b981',
  carbs: '#f59e0b',
  fat: '#ef4444',
};

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export function DashboardPage() {
  const { userId } = useCurrentUser();
  const [date, setDate] = useState(todayISO());
  const { data: user } = useUser(userId);
  const { data: daily } = useDailyLog(userId, date);
  const { data: foods } = useFoodLogs(userId, date);
  const createLog = useCreateFoodLog(userId);

  const intake = useMemo(() => foods?.reduce((s, f) => s + f.calories, 0) ?? 0, [foods]);
  const burned = daily?.calories_burned ?? 0;
  const net = intake - burned;
  const goal = user?.daily_calorie_goal ?? 0;
  const remaining = goal - net;
  const pct = goal > 0 ? Math.min(100, Math.round((net / goal) * 100)) : 0;
  const overBudget = remaining < 0;

  const macros = useMemo(() => {
    const protein = foods?.reduce((s, f) => s + f.protein_g, 0) ?? 0;
    const carbs = foods?.reduce((s, f) => s + f.carbs_g, 0) ?? 0;
    const fat = foods?.reduce((s, f) => s + f.fat_g, 0) ?? 0;
    const total = protein + carbs + fat;
    if (total === 0) return [];
    return [
      { name: 'Protein', value: round1(protein), pct: round1((protein / total) * 100), key: 'protein' },
      { name: 'Carbs', value: round1(carbs), pct: round1((carbs / total) * 100), key: 'carbs' },
      { name: 'Fat', value: round1(fat), pct: round1((fat / total) * 100), key: 'fat' },
    ];
  }, [foods]);

  const [quickAddMealType, setQuickAddMealType] = useState<CreateFoodLogInput['meal_type'] | null>(null);
  const [quickFoodSearch, setQuickFoodSearch] = useState('');
  const [quickQuantity, setQuickQuantity] = useState(100);
  const [quickSelectedFood, setQuickSelectedFood] = useState<Food | null>(null);

  const { data: searchResults = [] } = useFoodSearch(quickFoodSearch);

  const [suggestions, setSuggestions] = useState<Food[]>([]);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (remaining <= 0 || !user) {
      setSuggestions([]);
      return;
    }
    apiClient
      .get<Food[]>('/api/foods?q=')
      .then((data) => {
        const filtered = data
          .filter((f) => f.kcal_per_100g <= remaining * 1.2)
          .sort((a, b) => Math.abs(a.kcal_per_100g - remaining) - Math.abs(b.kcal_per_100g - remaining))
          .slice(0, 3);
        setSuggestions(filtered);
      })
      .catch(() => setSuggestions([]));
  }, [remaining, user, date]);

  function openQuickAdd(mealType: CreateFoodLogInput['meal_type']) {
    setQuickAddMealType(mealType);
    setQuickFoodSearch('');
    setQuickQuantity(100);
    setQuickSelectedFood(null);
  }

  function closeQuickAdd() {
    setQuickAddMealType(null);
    setQuickFoodSearch('');
    setQuickQuantity(100);
    setQuickSelectedFood(null);
  }

  function handleQuickAddSubmit() {
    if (!quickSelectedFood || !quickAddMealType || !userId) return;
    const calories = Math.round((quickSelectedFood.kcal_per_100g * quickQuantity) / 100);
    const payload: Omit<CreateFoodLogInput, 'log_date'> = {
      meal_type: quickAddMealType,
      food_name: quickSelectedFood.name,
      quantity_g: quickQuantity,
      calories,
      protein_g: round1((quickSelectedFood.protein_per_100g * quickQuantity) / 100),
      carbs_g: round1((quickSelectedFood.carbs_per_100g * quickQuantity) / 100),
      fat_g: round1((quickSelectedFood.fat_per_100g * quickQuantity) / 100),
    };
    createLog.mutate({ ...payload, log_date: date });
    message.success('Đã thêm món ăn thành công!');
    closeQuickAdd();
  }

  function applySuggestion(food: Food) {
    openQuickAdd('snack');
    setQuickSelectedFood(food);
    setQuickFoodSearch(food.name);
  }

  async function handleAiAnalysis() {
    setAiLoading(true);
    setAiModalOpen(true);
    setAiAnalysis('');
    try {
      const sleepHours = daily?.sleep_hours ?? 0;
      const waterMl = daily?.water_ml ?? 0;
      const weightKg = daily?.weight_kg ?? user?.weight_kg ?? 0;
      const prompt = `Bạn là chuyên gia dinh dưỡng. Hãy phân tích ngắn gọn (3-4 gạch) về tình trạng sức khỏe hôm nay dựa trên các chỉ số sau, trả lời bằng tiếng Việt:
- Calo nạp vào: ${intake} kcal (mục tiêu: ${goal} kcal)
- Calo tiêu hao vận động: ${burned} kcal
- Cân nặng: ${weightKg} kg
- Nước đã uống: ${waterMl} ml
- Giấc ngủ: ${sleepHours} giờ
- Tỷ lệ dinh dưỡng: Protein ${macros.find(m => m.key === 'protein')?.value || 0}g, Carbs ${macros.find(m => m.key === 'carbs')?.value || 0}g, Fat ${macros.find(m => m.key === 'fat')?.value || 0}g

Đánh giá các chỉ số đã ổn chưa và đưa ra gợi ý cải thiện ngắn gọn.`;

      const { generateWithGemini } = await import('../utils/gemini.js');
      const text = await generateWithGemini(prompt);
      setAiAnalysis(text);
    } catch (err) {
      setAiAnalysis('Lỗi: ' + (err as Error).message);
    } finally {
      setAiLoading(false);
    }
  }

  if (userId == null) {
    return (
      <Card className="!rounded-2xl">
        <Text type="secondary">Vui lòng chọn hoặc tạo hồ sơ ở trang Hồ sơ trước.</Text>
      </Card>
    );
  }

  const quickCalories = quickSelectedFood ? Math.round((quickSelectedFood.kcal_per_100g * quickQuantity) / 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Title level={3} className="!mb-0">Dashboard</Title>
        <DatePicker
          value={dayjs(date)}
          onChange={(d) => setDate(d ? d.format('YYYY-MM-DD') : '')}
          className="!w-auto"
          format="YYYY-MM-DD"
        />
      </div>

      <Card className="!rounded-2xl">
        <div className="mb-3 flex items-center justify-between">
          <Space>
            <FireOutlined className="text-2xl text-emerald-500" />
            <div>
              <Text strong className="text-base">Còn lại: {formatKcal(Math.max(0, remaining))} Kcal</Text>
              <div className="text-xs text-slate-500">
                Mục tiêu {formatKcal(goal)} - Nạp {formatKcal(intake)} + Tiêu hao {formatKcal(burned)} = Thực tế {formatKcal(net)} Kcal
              </div>
            </div>
          </Space>
          <div className="flex flex-wrap items-center gap-2">
            <Tag color={overBudget ? 'error' : 'success'} className="!m-0 !rounded-lg !px-3 !py-1">
              {overBudget ? `Vượt ${formatKcal(-remaining)} Kcal` : `Trong tầm kiểm soát`}
            </Tag>
          </div>
        </div>
        <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
          <span>Nạp {formatKcal(intake)}</span>
          <span>Tiêu hao {formatKcal(burned)}</span>
        </div>
        <Progress
          percent={pct}
          status={overBudget ? 'exception' : 'active'}
          strokeColor={{
            '0%': '#10b981',
            '100%': overBudget ? '#ef4444' : '#059669',
          }}
          trailColor="#f1f5f9"
          strokeWidth={12}
          format={() => `${formatKcal(net)} / ${formatKcal(goal)} Kcal`}
        />
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="!rounded-2xl">
          <Statistic
            title={<Text type="secondary">Cân nặng</Text>}
            suffix="kg"
            value={daily?.weight_kg ?? 0}
            precision={1}
          />
        </Card>
        <Card className="!rounded-2xl">
          <Statistic
            title={<Text type="secondary">Nước</Text>}
            suffix="ml"
            value={daily?.water_ml ?? 0}
          />
        </Card>
        <Card className="!rounded-2xl">
          <Statistic
            title={<Text type="secondary">Bước chân</Text>}
            value={daily?.steps ?? 0}
          />
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="!rounded-2xl">
          <div className="flex items-center gap-3">
            <FireOutlined className="text-2xl text-orange-500" />
            <div>
              <Text strong className="text-base">Vận động</Text>
              <div className="text-xs text-slate-500">Năng lượng tiêu hao khi vận động</div>
            </div>
          </div>
          <div className="mt-3">
            <Statistic
              title={<Text type="secondary">Calo tiêu hao</Text>}
              suffix="Kcal"
              value={burned}
            />
          </div>
        </Card>

        <Card className="!rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RobotOutlined className="text-2xl text-emerald-500" />
              <div>
                <Text strong className="text-base">Phân tích AI</Text>
                <div className="text-xs text-slate-500">Đánh giá chỉ số sức khỏe</div>
              </div>
            </div>
            <Button type="primary" icon={<RobotOutlined />} onClick={handleAiAnalysis} loading={aiLoading} className="!rounded-xl">
              Phân tích đánh giá
            </Button>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="!rounded-2xl" title={<Text strong>Chỉ số dinh dưỡng</Text>}>
          {macros.length === 0 ? (
            <div className="flex h-48 items-center justify-center">
              <Text type="secondary">Chưa có dữ liệu</Text>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={macros}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, pct }) => `${name}: ${pct}%`}
                  >
                    {macros.map((entry) => (
                      <Cell key={entry.key} fill={MACRO_COLORS[entry.key]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value}g`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 flex flex-wrap justify-center gap-4">
                {macros.map((m) => (
                  <div key={m.key} className="flex items-center gap-1.5 text-sm">
                    <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: MACRO_COLORS[m.key] }} />
                    <Text>{m.name}: {m.value}g ({m.pct}%)</Text>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card className="!rounded-2xl" title={<Text strong>Giấc ngủ</Text>}>
          <div className="flex flex-col items-center justify-center py-4">
            <ClockCircleOutlined className="mb-2 text-4xl text-indigo-400" />
            {daily?.sleep_hours != null && daily.sleep_hours > 0 ? (
              <>
                <Statistic
                  title={<Text type="secondary">Giấc ngủ</Text>}
                  suffix="giờ"
                  value={daily.sleep_hours}
                  precision={1}
                />
                <div className="mt-4 w-full">
                  <Progress
                    percent={Math.min(100, Math.round((daily.sleep_hours / 8) * 100))}
                    strokeColor="#6366f1"
                    trailColor="#e0e7ff"
                    strokeWidth={10}
                    format={() => `${daily.sleep_hours}/8 giờ`}
                  />
                </div>
              </>
            ) : (
              <Text type="secondary" className="mt-4">Chưa nhập</Text>
            )}
          </div>
        </Card>
      </div>

      <Card className="!rounded-2xl" title={<Text strong>Thêm nhanh</Text>}>
        <div className="flex flex-wrap gap-2">
          {MEAL_TYPE_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              type={quickAddMealType === opt.value ? 'primary' : 'default'}
              icon={<PlusOutlined />}
              onClick={() => openQuickAdd(opt.value)}
              className="!rounded-xl"
            >
              {opt.label}
            </Button>
          ))}
        </div>

        {quickAddMealType && (
          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
            <Text strong className="mb-3 block">
              Thêm nhanh — {MEAL_TYPE_OPTIONS.find((o) => o.value === quickAddMealType)?.label}
            </Text>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
              <div className="sm:col-span-5">
                <Text className="mb-1 block text-sm text-slate-600">Món ăn</Text>
                <Select
                  showSearch
                  value={quickSelectedFood ? quickSelectedFood.name : quickFoodSearch || undefined}
                  placeholder="Tìm món ăn..."
                  className="!w-full !rounded-xl"
                  defaultActiveFirstOption={false}
                  showArrow={false}
                  filterOption={false}
                  onSearch={setQuickFoodSearch}
                  onChange={(v) => {
                    setQuickFoodSearch(v);
                    const found = searchResults.find((r) => r.name === v);
                    if (found) setQuickSelectedFood(found);
                  }}
                  options={searchResults.map((food) => {
                    const label = (
                      <div className="flex items-center justify-between">
                        <span>{food.name}</span>
                        <span className="text-xs text-slate-400">{Math.round(food.kcal_per_100g)} Kcal/100g</span>
                      </div>
                    );
                    return { value: food.name, label };
                  })}
                  notFoundContent="Không tìm thấy. Thử từ khóa khác."
                />
              </div>
              <div className="sm:col-span-3">
                <Text className="mb-1 block text-sm text-slate-600">Khối lượng (g)</Text>
                <InputNumber
                  min={1}
                  value={quickQuantity}
                  onChange={(v) => setQuickQuantity(Number(v) || 0)}
                  className="!w-full !rounded-xl"
                  controls={false}
                />
              </div>
              <div className="sm:col-span-2 flex flex-col justify-end">
                <Text className="mb-1 block text-sm text-slate-600">Calo</Text>
                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-emerald-600">
                  {quickCalories} Kcal
                </div>
              </div>
              <div className="sm:col-span-2 flex flex-col justify-end gap-2">
                <Button
                  type="primary"
                  onClick={handleQuickAddSubmit}
                  disabled={!quickSelectedFood || quickQuantity <= 0}
                  loading={createLog.isPending}
                  className="!rounded-xl"
                >
                  Thêm nhanh
                </Button>
                <Button onClick={closeQuickAdd} className="!rounded-xl">
                  Hủy
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card className="!rounded-2xl" title={<Text strong>Gợi ý món ăn</Text>}>
        {suggestions.length === 0 ? (
          <Text type="secondary">Đang tải gợi ý...</Text>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {suggestions.map((food) => (
              <div
                key={food.id}
                onClick={() => applySuggestion(food)}
                className="cursor-pointer rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 transition hover:border-emerald-200 hover:bg-emerald-50/50"
              >
                <Text strong className="block">{food.name}</Text>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                  <span>{Math.round(food.kcal_per_100g)} Kcal/100g</span>
                  <span className="text-emerald-500">P: {food.protein_per_100g}g · C: {food.carbs_per_100g}g · F: {food.fat_per_100g}g</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="!rounded-2xl" title={<Text strong>Món ăn hôm nay</Text>}>
        {foods?.length === 0 && <Text type="secondary">Chưa có món nào.</Text>}
        <div className="space-y-3">
          {foods?.map((f) => (
            <div key={f.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/50 px-4 py-3">
              <div className="min-w-0 flex-1">
                <Text strong className="block truncate">{f.food_name}</Text>
                <div className="text-xs text-slate-500">
                  {f.meal_type} · {f.quantity_g}g
                </div>
              </div>
              <Text className="font-semibold text-emerald-600">{formatKcal(f.calories)} Kcal</Text>
            </div>
          ))}
        </div>
      </Card>

      <Modal
        title={
          <span className="flex items-center gap-2">
            <RobotOutlined /> Phân tích đánh giá sức khỏe
          </span>
        }
        open={aiModalOpen}
        onCancel={() => setAiModalOpen(false)}
        footer={null}
        width={600}
        className="!max-w-[95vw]"
      >
        <div className="space-y-4">
          {aiLoading && <div className="flex items-center justify-center py-8"><Spin /></div>}
          {!aiLoading && aiAnalysis && (
            <div className="whitespace-pre-line rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-sm leading-relaxed text-slate-700">
              {aiAnalysis}
            </div>
          )}
          {!aiLoading && !aiAnalysis && (
            <Text type="secondary">Nhấn "Phân tích đánh giá" để bắt đầu.</Text>
          )}
        </div>
      </Modal>
    </div>
  );
}
