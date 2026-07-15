import { useState, useEffect, useRef, useCallback } from 'react';
import { Input, InputNumber, Button, DatePicker, Select, Progress, Tag, Typography, message, Space } from 'antd';
import { BellOutlined, LinkOutlined, DisconnectOutlined, SyncOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useDailyLog, useUpsertDailyLog } from '../hooks/useDailyLogs';
import { useStravaStatus, useStravaConnect, useStravaDisconnect, useStravaSync } from '../hooks/useStrava';
import { useServiceWorker } from '../hooks/useServiceWorker';
import { Card, Field } from '../components/ui';
import type { UpsertDailyLogInput } from '@health-tracker/shared';
import { todayISO } from '../lib/format';

const { Text } = Typography;

const REMINDER_KEY = 'health-tracker:water-reminder';

interface ReminderPersist {
  active: boolean;
  nextReminderAt: number;
  intervalMinutes: number;
}

function loadReminder(): ReminderPersist | null {
  try {
    const raw = localStorage.getItem(REMINDER_KEY);
    return raw ? (JSON.parse(raw) as ReminderPersist) : null;
  } catch {
    return null;
  }
}

function persistReminder(state: ReminderPersist | null): void {
  try {
    if (state) localStorage.setItem(REMINDER_KEY, JSON.stringify(state));
    else localStorage.removeItem(REMINDER_KEY);
  } catch {
    /* localStorage unavailable */
  }
}

function StravaCard({ userId }: { userId: number | null }) {
  const { data: status, isLoading: statusLoading } = useStravaStatus(userId);
  const connect = useStravaConnect(userId);
  const disconnect = useStravaDisconnect(userId);
  const sync = useStravaSync(userId);

  if (statusLoading) {
    return (
      <Card className="!rounded-2xl" title={<span className="text-lg font-semibold">Strava</span>}>
        <Text type="secondary">Đang kiểm tra...</Text>
      </Card>
    );
  }

  const isConnected = status?.connected === true;

  return (
    <Card className="!rounded-2xl" title={<span className="text-lg font-semibold">Strava</span>}>
      {isConnected ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Text strong className="text-emerald-600">Đã kết nối</Text>
            <div className="text-xs text-slate-500">
              Athlete ID: {status.athleteId}
            </div>
          </div>
          <Space>
            <Button
              icon={<SyncOutlined />}
              onClick={() => sync.mutate()}
              loading={sync.isPending}
              className="!rounded-xl"
            >
              Đồng bộ
            </Button>
            <Button
              danger
              icon={<DisconnectOutlined />}
              onClick={() => disconnect.mutate()}
              loading={disconnect.isPending}
              className="!rounded-xl"
            >
              Ngắt kết nối
            </Button>
          </Space>
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Text type="secondary">Đồng bộ hoạt động thể thao từ Strava</Text>
          <Button
            type="primary"
            icon={<LinkOutlined />}
            onClick={() => connect.mutate()}
            loading={connect.isPending}
            className="!rounded-xl"
          >
            Kết nối Strava
          </Button>
        </div>
      )}
      {sync.isError && (
        <p className="mt-2 text-sm text-rose-500">{(sync.error as Error).message}</p>
      )}
      {sync.isSuccess && (
        <p className="mt-2 text-sm text-emerald-600">
          Đã đồng bộ {sync.data?.activitiesSynced} hoạt động · +{sync.data?.stepsAdded} bước · +{sync.data?.caloriesBurnedAdded} Kcal
        </p>
      )}
    </Card>
  );
}

export function DailyLogPage() {
  const { userId } = useCurrentUser();
  const { registration: swRegistration } = useServiceWorker();
  const [date, setDate] = useState(todayISO());
  const { data: daily } = useDailyLog(userId, date);
  const upsert = useUpsertDailyLog(userId);

  const [form, setForm] = useState<UpsertDailyLogInput>({
    log_date: date,
    weight_kg: daily?.weight_kg ?? undefined,
    water_ml: daily?.water_ml ?? 0,
    recommended_water_ml: daily?.recommended_water_ml ?? 0,
    water_reminder_interval_minutes: daily?.water_reminder_interval_minutes ?? 20,
    steps: daily?.steps ?? 0,
    exercise_min: daily?.exercise_min ?? 0,
    calories_burned: daily?.calories_burned ?? 0,
    sleep_hours: daily?.sleep_hours ?? undefined,
    note: daily?.note ?? undefined,
  });

  const [reminderActive, setReminderActive] = useState(false);
  const [reminderCountdown, setReminderCountdown] = useState(20);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextReminderAtRef = useRef(0);
  const intervalMinutesRef = useRef(20);
  const recommendedWaterRef = useRef(0);

  const isIOSSafari = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !('standalone' in window && (window as any).standalone);

  const recommendedWater = form.weight_kg ? Math.round(form.weight_kg * 0.04 * 1000) : form.recommended_water_ml ?? 0;
  const waterPct = recommendedWater > 0 ? Math.min(100, Math.round(((form.water_ml ?? 0) / recommendedWater) * 100)) : 0;
  recommendedWaterRef.current = recommendedWater;

  useEffect(() => {
    setForm({
      log_date: date,
      weight_kg: daily?.weight_kg ?? undefined,
      water_ml: daily?.water_ml ?? 0,
      recommended_water_ml: daily?.recommended_water_ml ?? 0,
      water_reminder_interval_minutes: daily?.water_reminder_interval_minutes ?? 20,
      steps: daily?.steps ?? 0,
      exercise_min: daily?.exercise_min ?? 0,
      calories_burned: daily?.calories_burned ?? 0,
      sleep_hours: daily?.sleep_hours ?? undefined,
      note: daily?.note ?? undefined,
    });
  }, [date, daily]);

  const fireNotification = useCallback(() => {
    const target = recommendedWaterRef.current;
    const title = 'Nhắc nhở uống nước 💧';
    const options = {
      body: `Đã đến giờ uống nước! Mục tiêu: ${target} ml/ngày`,
      tag: 'water-reminder',
      requireInteraction: true,
    };

    if (swRegistration && 'showNotification' in swRegistration) {
      swRegistration.showNotification(title, options).catch(() => {
        message.info('Đến giờ uống nước! 💧');
      });
      return;
    }

    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, options);
      } else {
        message.info('Đến giờ uống nước! 💧');
      }
    } catch {
      message.info('Đến giờ uống nước! 💧');
    }
  }, [swRegistration]);

  // Timestamp-anchored ticker: derives the remaining minutes from an absolute
  // next-reminder time so the countdown survives a page refresh.
  const startTicker = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const remainingMs = nextReminderAtRef.current - now;
      if (remainingMs <= 0) {
        fireNotification();
        const next = now + intervalMinutesRef.current * 60000;
        nextReminderAtRef.current = next;
        persistReminder({ active: true, nextReminderAt: next, intervalMinutes: intervalMinutesRef.current });
        setReminderCountdown(intervalMinutesRef.current);
      } else {
        setReminderCountdown(Math.max(0, Math.ceil(remainingMs / 60000)));
      }
    }, 1000);
  }, [fireNotification]);

  const startReminder = useCallback(() => {
    if (!('Notification' in window)) {
      message.error('Trình duyệt không hỗ trợ thông báo');
      return;
    }

    const minutes = form.water_reminder_interval_minutes ?? 20;

    const enable = () => {
      const next = Date.now() + minutes * 60000;
      nextReminderAtRef.current = next;
      intervalMinutesRef.current = minutes;
      persistReminder({ active: true, nextReminderAt: next, intervalMinutes: minutes });
      setReminderActive(true);
      setReminderCountdown(minutes);
      startTicker();
    };

    if (Notification.permission === 'granted') {
      enable();
      return;
    }

    if (Notification.permission === 'denied') {
      message.error('Vui lòng bật quyền thông báo trong cài đặt trình duyệt để nhận nhắc nhở');
      return;
    }

    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        enable();
      } else {
        message.error('Vui lòng cấp quyền thông báo để nhận nhắc nhở');
      }
    }).catch(() => {
      message.error('Không thể yêu cầu quyền thông báo');
    });
  }, [form.water_reminder_interval_minutes, startTicker]);

  const stopReminder = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setReminderActive(false);
    persistReminder(null);
  }, []);

  // Resume the countdown after F5 / SPA reload, and clean up on unmount.
  useEffect(() => {
    const saved = loadReminder();
    if (saved?.active) {
      const now = Date.now();
      let next = saved.nextReminderAt;
      if (next <= now) {
        fireNotification();
        next = now + saved.intervalMinutes * 60000;
      }
      nextReminderAtRef.current = next;
      intervalMinutesRef.current = saved.intervalMinutes;
      persistReminder({ active: true, nextReminderAt: next, intervalMinutes: saved.intervalMinutes });
      setReminderActive(true);
      setReminderCountdown(Math.max(0, Math.ceil((next - now) / 60000)));
      startTicker();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startTicker, fireNotification]);

  // Keep the running interval in sync if the user changes it while active.
  useEffect(() => {
    if (!reminderActive) return;
    const minutes = form.water_reminder_interval_minutes ?? 20;
    intervalMinutesRef.current = minutes;
    const saved = loadReminder();
    if (saved) persistReminder({ ...saved, intervalMinutes: minutes });
  }, [form.water_reminder_interval_minutes, reminderActive]);

  const sipWater = useCallback(() => {
    setForm((prev) => ({ ...prev, water_ml: (prev.water_ml ?? 0) + 200 }));
  }, []);

  // iOS Safari: when app returns to foreground, check if we missed a reminder
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && reminderActive) {
        const now = Date.now();
        if (nextReminderAtRef.current <= now) {
          fireNotification();
          const next = now + intervalMinutesRef.current * 60000;
          nextReminderAtRef.current = next;
          persistReminder({ active: true, nextReminderAt: next, intervalMinutes: intervalMinutesRef.current });
          setReminderCountdown(intervalMinutesRef.current);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [reminderActive, fireNotification]);

  if (userId == null) return <Card>Vui lòng chọn hồ sơ ở trang Hồ sơ trước.</Card>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Cân nặng & Nước</h1>
        <DatePicker
          value={date ? dayjs(date) : null}
          onChange={(d) => {
            const v = d ? d.format('YYYY-MM-DD') : todayISO();
            setDate(v);
            setForm((f) => ({ ...f, log_date: v }));
          }}
          className="!rounded-xl"
          format="YYYY-MM-DD"
        />
      </div>

      <Card className="!rounded-2xl" title={<span className="text-lg font-semibold">Mục tiêu nước hôm nay</span>}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <Text type="secondary">Khuyến nghị: {recommendedWater} ml/ngày</Text>
            <div className="text-xs text-slate-400">
              Dựa trên cân nặng {form.weight_kg ?? '—'} kg × 0.04L
            </div>
          </div>
          <Tag color="cyan" className="!m-0 !rounded-lg">
            Đã uống {form.water_ml ?? 0} / {recommendedWater} ml
          </Tag>
        </div>
        <Progress
          percent={waterPct}
          status={waterPct >= 100 ? 'success' : 'active'}
          strokeColor="#10b981"
          trailColor="#f1f5f9"
          strokeWidth={12}
        />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button size="small" onClick={sipWater} className="!rounded-lg">
            + Uống 200ml
          </Button>
          {!reminderActive ? (
            <Button size="small" type="primary" onClick={startReminder} className="!rounded-lg">
              <BellOutlined /> Bật nhắc nhở
            </Button>
          ) : (
            <Button size="small" onClick={stopReminder} className="!rounded-lg">
              Tắt nhắc nhở
            </Button>
          )}
          {reminderActive && (
            <Tag color="blue" className="!m-0">
              Nhắc sau: {reminderCountdown} phút
            </Tag>
          )}
          {isIOSSafari && reminderActive && (
            <Tag color="orange" className="!m-0">
              Mở Safari → Chia sẻ → Thêm vào MHĐ để nhận thông báo nền
            </Tag>
          )}
          {isIOSSafari && !reminderActive && (
            <Text type="secondary" className="text-xs">
              Trên iPhone, thêm app vào Màn hình chính để nhận thông báo nền
            </Text>
          )}
        </div>
      </Card>

      <StravaCard userId={userId} />

      <Card className="!rounded-2xl" title={<span className="text-lg font-semibold">Nhật ký hàng ngày</span>}>
        <form
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            upsert.mutate({ ...form, log_date: date, recommended_water_ml: recommendedWater });
          }}
        >
          <Field label="Cân nặng (kg)">
            <InputNumber
              step={0.1}
              min={0}
              value={form.weight_kg}
              onChange={(v) => setForm({ ...form, weight_kg: v ?? undefined })}
              className="!w-full !rounded-xl"
              controls={false}
            />
          </Field>
          <Field label="Nước đã uống (ml)">
            <InputNumber
              min={0}
              value={form.water_ml}
              onChange={(v) => setForm({ ...form, water_ml: Number(v) })}
              className="!w-full !rounded-xl"
              controls={false}
            />
          </Field>
          <Field label="Mục tiêu nước (ml)">
            <InputNumber
              min={0}
              value={recommendedWater}
              disabled
              className="!w-full !rounded-xl"
              controls={false}
            />
          </Field>
          <Field label="Nhắc mỗi (phút)">
            <Select
              value={form.water_reminder_interval_minutes ?? 20}
              onChange={(v) => setForm({ ...form, water_reminder_interval_minutes: v })}
              className="!rounded-xl"
              options={[
                { value: 15, label: '15 phút' },
                { value: 20, label: '20 phút' },
                { value: 30, label: '30 phút' },
                { value: 45, label: '45 phút' },
                { value: 60, label: '60 phút' },
              ]}
            />
          </Field>
          <Field label="Bước chân">
            <InputNumber
              min={0}
              value={form.steps}
              onChange={(v) => setForm({ ...form, steps: Number(v) })}
              className="!w-full !rounded-xl"
              controls={false}
            />
          </Field>
          <Field label="Vận động (phút)">
            <InputNumber
              min={0}
              value={form.exercise_min}
              onChange={(v) => setForm({ ...form, exercise_min: Number(v) })}
              className="!w-full !rounded-xl"
              controls={false}
            />
          </Field>
          <Field label="Calo tiêu hao">
            <InputNumber
              min={0}
              value={form.calories_burned}
              onChange={(v) => setForm({ ...form, calories_burned: Number(v) })}
              className="!w-full !rounded-xl"
              controls={false}
            />
          </Field>
          <Field label="Giấc ngủ (giờ)">
            <InputNumber
              step={0.5}
              min={0}
              max={24}
              value={form.sleep_hours}
              onChange={(v) => setForm({ ...form, sleep_hours: v ?? undefined })}
              className="!w-full !rounded-xl"
              controls={false}
            />
          </Field>
          <Field label="Ghi chú">
            <Input
              value={form.note ?? ''}
              onChange={(e) => setForm({ ...form, note: e.target.value || undefined })}
              className="!rounded-xl"
            />
          </Field>
          <div className="col-span-1 flex items-end sm:col-span-2 lg:col-span-3">
            <Button type="primary" htmlType="submit" disabled={upsert.isPending} size="large" className="!rounded-xl">
              {upsert.isPending ? 'Đang lưu...' : 'Lưu nhật ký'}
            </Button>
          </div>
        </form>
        {upsert.isError && (
          <p className="mt-2 text-sm text-rose-500">{(upsert.error as Error).message}</p>
        )}
      </Card>
    </div>
  );
}
