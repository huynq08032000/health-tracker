import { useMemo, useState } from 'react';
import { Card, Progress, Statistic, Typography, Tag, Space, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { FireOutlined } from '@ant-design/icons';
import { useUser } from '../hooks/useUsers';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useDailyLog } from '../hooks/useDailyLogs';
import { useFoodLogs } from '../hooks/useFoodLogs';
import { formatKcal, todayISO } from '../lib/format';

const { Title, Text } = Typography;

export function DashboardPage() {
  const { userId } = useCurrentUser();
  const [date, setDate] = useState(todayISO());
  const { data: user } = useUser(userId);
  const { data: daily } = useDailyLog(userId, date);
  const { data: foods } = useFoodLogs(userId, date);

  const intake = useMemo(() => foods?.reduce((s, f) => s + f.calories, 0) ?? 0, [foods]);
  const goal = user?.daily_calorie_goal ?? 0;
  const remaining = goal - intake;
  const pct = goal > 0 ? Math.min(100, Math.round((intake / goal) * 100)) : 0;
  const overCal = remaining < 0;

  if (userId == null) {
    return (
      <Card className="!rounded-2xl">
        <Text type="secondary">Vui lòng chọn hoặc tạo hồ sơ ở trang Hồ sơ trước.</Text>
      </Card>
    );
  }

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
        <div className="mb-4 flex items-center justify-between">
          <Space>
            <FireOutlined className="text-2xl text-emerald-500" />
            <div>
              <Text strong className="text-base">Calo nạp vào</Text>
              <div className="text-xs text-slate-500">
                {formatKcal(intake)} / {formatKcal(goal)} Kcal
              </div>
            </div>
          </Space>
          <Tag color={overCal ? 'error' : 'success'} className="!m-0 !rounded-lg !px-3 !py-1">
            {overCal ? `Vượt ${formatKcal(-remaining)} Kcal` : `Còn lại ${formatKcal(remaining)} Kcal`}
          </Tag>
        </div>
        <Progress
          percent={pct}
          status={overCal ? 'exception' : 'active'}
          strokeColor={{
            '0%': '#10b981',
            '100%': overCal ? '#ef4444' : '#059669',
          }}
          trailColor="#f1f5f9"
          strokeWidth={12}
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

      <Card className="!rounded-2xl" title={<Text strong>Món ăn hôm nay</Text>}>
        {foods?.length === 0 && <Text type="secondary">Chưa có món nào.</Text>}
        <div className="space-y-3">
          {foods?.map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-4 py-3">
              <div>
                <Text strong>{f.food_name}</Text>
                <div className="text-xs text-slate-500">
                  {f.meal_type} · {f.quantity_g}g
                </div>
              </div>
              <Text className="font-semibold text-emerald-600">{formatKcal(f.calories)} Kcal</Text>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
