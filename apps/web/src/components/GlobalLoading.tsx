import { Spin, Typography, Space } from 'antd';

const { Text } = Typography;

export function GlobalLoading() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white"
      style={{ animation: 'global-loading-fade-in 0.3s ease-out' }}
    >
      <Space direction="vertical" align="center" size="middle">
        <Spin size="large" />
        <Text className="text-lg text-emerald-700">Đang kết nối...</Text>
        <Text type="secondary" className="text-sm">
          Vui lòng đợi trong giây lát
        </Text>
      </Space>
    </div>
  );
}
