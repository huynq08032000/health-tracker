import { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { apiClient } from '../api/client';
import type { AuthResponse } from '@health-tracker/shared';

const { Title, Text } = Typography;

export function LoginPage() {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const data = await apiClient.post<AuthResponse>('/api/auth/login', values);
      localStorage.setItem('health-tracker:token', data.token);
      localStorage.setItem('health-tracker:currentUserId', String(data.user.id));
      message.success('Đăng nhập thành công!');
      window.location.href = '/';
    } catch (err) {
      message.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="!w-full !max-w-md !rounded-2xl" title={<Title level={3} className="!mb-0">Đăng nhập</Title>}>
        <Form name="login" onFinish={onFinish} layout="vertical" size="large">
          <Form.Item name="username" rules={[{ required: true, message: 'Nhập username' }]}>
            <Input prefix={<UserOutlined />} placeholder="Username" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'Nhập mật khẩu' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block className="!rounded-xl">
              Đăng nhập
            </Button>
          </Form.Item>
          <Text type="secondary">
            Chưa có tài khoản? <a href="/register" className="text-emerald-600">Đăng ký</a>
          </Text>
        </Form>
      </Card>
    </div>
  );
}
