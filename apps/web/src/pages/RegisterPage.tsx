import { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { apiClient } from '../api/client';
import type { RegisterInput } from '@health-tracker/shared';

const { Title, Text } = Typography;

export function RegisterPage() {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: RegisterInput & { confirmPassword: string }) => {
    if (values.password !== values.confirmPassword) {
      message.error('Mật khẩu không khớp');
      return;
    }
    setLoading(true);
    try {
      const { confirmPassword, ...payload } = values;
      await apiClient.post('/api/auth/register', payload);
      message.success('Đăng ký thành công! Vui lòng đăng nhập.');
      window.location.href = '/login';
    } catch (err) {
      message.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="!w-full !max-w-md !rounded-2xl" title={<Title level={3} className="!mb-0">Đăng ký</Title>}>
        <Form name="register" onFinish={onFinish} layout="vertical" size="large">
          <Form.Item name="username" rules={[{ required: true, message: 'Nhập username' }]}>
            <Input prefix={<UserOutlined />} placeholder="Username" />
          </Form.Item>
          <Form.Item name="display_name" rules={[{ required: true, message: 'Nhập tên hiển thị' }]}>
            <Input prefix={<MailOutlined />} placeholder="Tên hiển thị" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'Nhập mật khẩu' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
          </Form.Item>
          <Form.Item name="confirmPassword" rules={[{ required: true, message: 'Xác nhận mật khẩu' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Xác nhận mật khẩu" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block className="!rounded-xl">
              Đăng ký
            </Button>
          </Form.Item>
          <Text type="secondary">
            Đã có tài khoản? <a href="/login" className="text-emerald-600">Đăng nhập</a>
          </Text>
        </Form>
      </Card>
    </div>
  );
}
