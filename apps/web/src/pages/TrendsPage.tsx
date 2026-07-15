import { useMemo, useState } from 'react';
import { Card, DatePicker, Typography, Space, Spin, Progress, Tag } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, ReferenceLine, Cell } from 'recharts';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useDailyLogRange } from '../hooks/useDailyLogs';
import { useUser } from '../hooks/useUsers';
import { todayISO } from '../lib/format';
import type { DailyLog } from '@health-tracker/shared';
import { ThunderboltOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const EMERALD = '#10b981';

interface ChartPoint {
  date: string;
  weight: number | null;
  water: number;
  intake: number;
  burned: number;
  steps: number;
}

function toChartData(logs: DailyLog[]): ChartPoint[] {
  return [...logs]
    .sort((a, b) => a.log_date.localeCompare(b.log_date))
    .map((log) => ({
      date: log.log_date,
      weight: log.weight_kg,
      water: log.water_ml,
      intake: log.calories_intake,
      burned: log.calories_burned,
      steps: log.steps,
    }));
}

function ChartCard({
  title,
  data,
  dataKey,
  unit,
  isLoading,
  isEmpty,
  error,
}: {
  title: string;
  data: ChartPoint[];
  dataKey: keyof ChartPoint;
  unit: string;
  isLoading: boolean;
  isEmpty: boolean;
  error: unknown;
}) {
  const errorMessage = error instanceof Error ? error.message : 'Đã xảy ra lỗi';

  return (
    <Card className="!rounded-2xl">
      <Title level={5} className="!mb-3 !text-slate-700">
        {title} <span className="text-xs font-normal text-slate-400">({unit})</span>
      </Title>

      {isLoading ? (
        <div className="flex items-center justify-center" style={{ height: 280 }}>
          <Spin />
        </div>
      ) : error ? (
        <p className="text-red-500">Lỗi: {errorMessage}</p>
      ) : isEmpty ? (
        <p className="text-slate-400">Không có dữ liệu trong khoảng thời gian này</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value: number | string) => [`${value} ${unit}`, title]}
              labelFormatter={(label) => `Ngày: ${label}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey={dataKey}
              name={title}
              stroke={EMERALD}
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

export function TrendsPage() {
  const { userId } = useCurrentUser();
  const { data: user } = useUser(userId);

  const [from, setFrom] = useState<string>(dayjs().subtract(6, 'day').format('YYYY-MM-DD'));
  const [to, setTo] = useState<string>(todayISO());

  const { data, isLoading, error } = useDailyLogRange(userId, from, to);

  const logs = useMemo(() => data ?? [], [data]);
  const chartData = useMemo(() => toChartData(logs), [logs]);
  const isEmpty = !isLoading && logs.length === 0;

  const goal = user?.daily_calorie_goal ?? 2000;
  const daysWithIntake = useMemo(() => logs.filter((l) => (l.calories_intake || 0) > 0), [logs]);
  const netLogs = useMemo(() => logs.map((l) => ({ ...l, net_calories: (l.calories_intake || 0) - (l.calories_burned || 0) })), [logs]);
  const totalNet = useMemo(() => netLogs.reduce((s, l) => s + l.net_calories, 0), [netLogs]);
  const totalMax = daysWithIntake.length * goal;
  const surplus = totalNet - totalMax;
  const pct = totalMax > 0 ? Math.min(100, Math.round((totalNet / totalMax) * 100)) : 0;
  const overBudget = surplus > 0;

  const insight = useMemo(() => {
    if (netLogs.length === 0) return 'Chưa có đủ dữ liệu để đưa ra nhận định.';
    const avgNet = Math.round(totalNet / netLogs.length);
    const underDays = netLogs.filter((l) => l.net_calories <= goal).length;
    const overDays = netLogs.length - underDays;
    if (overDays === 0) {
      return `Tuần này, bạn duy trì net calo trung bình ${avgNet} Kcal/ngày. Bạn đã thành công ${underDays}/${netLogs.length} ngày nằm trong ngân sách calo.`;
    }
    return `Tuần này, bạn đạt trung bình ${avgNet} Kcal Net mỗi ngày. Bạn đã vượt ngân sách ${overDays} ngày và nằm trong tầm kiểm soát ${underDays} ngày.`;
  }, [netLogs, totalNet]);

  const handleFrom = (value: Dayjs | null) => {
    setFrom(value ? value.format('YYYY-MM-DD') : dayjs().subtract(6, 'day').format('YYYY-MM-DD'));
  };

  const handleTo = (value: Dayjs | null) => {
    setTo(value ? value.format('YYYY-MM-DD') : todayISO());
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4">
      <Space direction="vertical" size={4} className="w-full">
        <Title level={3} className="!mb-0">Xu hướng sức khỏe</Title>
        <Text type="secondary">Theo dõi các chỉ số sức khỏe theo thời gian</Text>
      </Space>

      <Card className="!rounded-2xl">
        <Space wrap size="large">
          <Space direction="vertical" size={2}>
            <Text className="text-xs text-slate-500">Từ ngày</Text>
            <DatePicker
              value={dayjs(from)}
              onChange={handleFrom}
              className="!rounded-xl"
              format="YYYY-MM-DD"
              allowClear={false}
            />
          </Space>
          <Space direction="vertical" size={2}>
            <Text className="text-xs text-slate-500">Đến ngày</Text>
            <DatePicker
              value={dayjs(to)}
              onChange={handleTo}
              className="!rounded-xl"
              format="YYYY-MM-DD"
              allowClear={false}
            />
          </Space>
        </Space>
      </Card>

      <Card className="!rounded-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Text strong>Tổng Net Calories</Text>
            <div className="text-xs text-slate-500">
              {netLogs.length > 0
                ? `${totalNet} / ${totalMax} Kcal (${netLogs.length} ngày có dữ liệu)`
                : 'Chưa có dữ liệu trong khoảng thời gian này'}
            </div>
          </div>
          {netLogs.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Tag color={overBudget ? 'error' : 'success'} className="!m-0 !rounded-lg !px-3 !py-1">
                {overBudget ? `Nạp thừa ${surplus} Kcal` : `Giảm được ${Math.abs(surplus)} Kcal`}
              </Tag>
            </div>
          )}
        </div>
        {netLogs.length > 0 && (
          <div className="mt-3">
            <Progress
              percent={pct}
              status={overBudget ? 'exception' : 'active'}
              strokeColor={{
                '0%': '#10b981',
                '100%': overBudget ? '#ef4444' : '#059669',
              }}
              trailColor="#f1f5f9"
              strokeWidth={12}
              format={() => `${totalNet} / ${totalMax} Kcal`}
            />
          </div>
        )}
      </Card>

      <Card className="!rounded-2xl">
        <Title level={5} className="!mb-3 !text-slate-700">
          Net Calories theo ngày <span className="text-xs font-normal text-slate-400">(Kcal)</span>
        </Title>
        {isLoading ? (
          <div className="flex items-center justify-center" style={{ height: 280 }}>
            <Spin />
          </div>
        ) : isEmpty ? (
          <p className="text-slate-400">Không có dữ liệu trong khoảng thời gian này</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={netLogs} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number | string) => [`${value} Kcal`, 'Net Calories']}
                labelFormatter={(label) => `Ngày: ${label}`}
              />
              <ReferenceLine y={goal} stroke="#ef4444" strokeDasharray="4 4" label={{ value: `Mục tiêu ${goal}`, position: 'top', fill: '#ef4444', fontSize: 12 }} />
              <Bar dataKey="net_calories" name="Net Calories" radius={[4, 4, 0, 0]}>
                {netLogs.map((entry) => (
                  <Cell key={entry.log_date} fill={entry.net_calories <= goal ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card className="!rounded-2xl">
        <div className="flex items-start gap-3">
          <ThunderboltOutlined className="mt-1 text-xl text-orange-500" />
          <div>
            <Text strong>Phân tích nhanh</Text>
            <div className="mt-1 text-sm text-slate-600">{insight}</div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Cân nặng"
          unit="kg"
          data={chartData}
          dataKey="weight"
          isLoading={isLoading}
          isEmpty={isEmpty}
          error={error}
        />
        <ChartCard
          title="Nước"
          unit="ml"
          data={chartData}
          dataKey="water"
          isLoading={isLoading}
          isEmpty={isEmpty}
          error={error}
        />
        <ChartCard
          title="Calo nạp vào"
          unit="kcal"
          data={chartData}
          dataKey="intake"
          isLoading={isLoading}
          isEmpty={isEmpty}
          error={error}
        />
        <ChartCard
          title="Calo tiêu hao"
          unit="kcal"
          data={chartData}
          dataKey="burned"
          isLoading={isLoading}
          isEmpty={isEmpty}
          error={error}
        />
        <ChartCard
          title="Bước chân"
          unit="steps"
          data={chartData}
          dataKey="steps"
          isLoading={isLoading}
          isEmpty={isEmpty}
          error={error}
        />
      </div>
    </div>
  );
}
