import { useState, useEffect, useRef } from 'react';
import { Form, Input, InputNumber, Select, Radio, Button, Tabs, DatePicker, message, ConfigProvider } from 'antd';
import { UserOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useUser, useUpdateUser } from '../hooks/useUsers';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { Card } from '../components/ui';
import type { UpdateUserInput } from '@health-tracker/shared';
import { antdTheme } from '../theme/antd-theme';

interface FormValues {
  display_name: string;
  gender: 'male' | 'female' | 'other';
  birth_date: dayjs.Dayjs | null;
  height_cm: number;
  weight_kg: number;
  activity_level: string;
  goal: string;
}

export function ProfilePage() {
  const { userId } = useCurrentUser();
  const { data: currentUser, isLoading } = useUser(userId);
  const [form] = Form.useForm<FormValues>();
  const [activeTab, setActiveTab] = useState('edit');
  const initialized = useRef(false);

  const update = useUpdateUser();

  useEffect(() => {
    if (currentUser && !initialized.current) {
      form.setFieldsValue({
        display_name: currentUser.display_name,
        gender: currentUser.gender,
        birth_date: currentUser.birth_date ? dayjs(currentUser.birth_date) : null,
        height_cm: currentUser.height_cm,
        weight_kg: currentUser.weight_kg,
        activity_level: currentUser.activity_level,
        goal: currentUser.goal,
      });
      initialized.current = true;
    }
  }, [currentUser, form]);

  const onEditFinish = async (values: FormValues) => {
    if (userId == null) return;
    try {
      const payload: UpdateUserInput = {
        display_name: values.display_name,
        gender: values.gender,
        birth_date: values.birth_date ? values.birth_date.format('YYYY-MM-DD') : undefined,
        height_cm: values.height_cm,
        weight_kg: values.weight_kg,
        activity_level: values.activity_level as UpdateUserInput['activity_level'],
        goal: values.goal as UpdateUserInput['goal'],
      };
      await update.mutateAsync({ id: userId, input: payload });
      message.success('Đã cập nhật hồ sơ!');
      initialized.current = false;
    } catch (err) {
      message.error((err as Error).message);
    }
  };

  const handleTabChange = (key: string) => {
    if (key === 'edit' && currentUser && !form.isFieldsTouched()) {
      form.setFieldsValue({
        display_name: currentUser.display_name,
        gender: currentUser.gender,
        birth_date: currentUser.birth_date ? dayjs(currentUser.birth_date) : null,
        height_cm: currentUser.height_cm,
        weight_kg: currentUser.weight_kg,
        activity_level: currentUser.activity_level,
        goal: currentUser.goal,
      });
    }
    setActiveTab(key);
  };

  if (userId == null) {
    return (
      <Card className="!rounded-2xl">
        <p className="text-slate-500">Vui lòng đăng nhập để xem hồ sơ.</p>
      </Card>
    );
  }

  if (isLoading || !currentUser) {
    return (
      <Card className="!rounded-2xl">
        <p className="text-slate-500">Đang tải...</p>
      </Card>
    );
  }

  return (
    <ConfigProvider theme={antdTheme}>
      <div className="mx-auto max-w-2xl">
        <Card className="!rounded-2xl" title={<span className="text-lg font-semibold">Hồ sơ của tôi</span>}>
          <div className="mb-6 rounded-xl bg-slate-50 p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Username</span>
                <p className="font-medium">{currentUser.username}</p>
              </div>
              <div>
                <span className="text-slate-500">Tên hiển thị</span>
                <p className="font-medium">{currentUser.display_name}</p>
              </div>
              <div>
                <span className="text-slate-500">Mục tiêu calo</span>
                <p className="font-medium">{currentUser.daily_calorie_goal} Kcal/ngày</p>
              </div>
              <div>
                <span className="text-slate-500">Ngày tạo</span>
                <p className="font-medium">{currentUser.created_at}</p>
              </div>
              <div>
                <span className="text-slate-500">Cập nhật lần cuối</span>
                <p className="font-medium">{currentUser.updated_at}</p>
              </div>
            </div>
          </div>

          <Tabs activeKey={activeTab} onChange={handleTabChange} items={[
            {
              key: 'edit',
              label: <span><EditOutlined /> Chỉnh sửa hồ sơ</span>,
              children: (
                <Form form={form} onFinish={onEditFinish} layout="vertical" size="large" className="!space-y-4">
                  <Form.Item name="display_name" label="Tên hiển thị" rules={[{ required: true, message: 'Nhập tên hiển thị' }]}>
                    <Input prefix={<UserOutlined />} className="!rounded-xl" placeholder="Tên hiển thị" />
                  </Form.Item>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Form.Item name="gender" label="Giới tính">
                      <Radio.Group optionType="button" buttonStyle="solid" className="!w-full">
                        <Radio.Button value="male" className="!flex-1">Nam</Radio.Button>
                        <Radio.Button value="female" className="!flex-1">Nữ</Radio.Button>
                        <Radio.Button value="other" className="!flex-1">Khác</Radio.Button>
                      </Radio.Group>
                    </Form.Item>
                    <Form.Item name="birth_date" label="Ngày sinh">
                      <DatePicker className="!w-full !rounded-xl" format="YYYY-MM-DD" placeholder="Chọn ngày" />
                    </Form.Item>
                    <Form.Item name="height_cm" label="Chiều cao (cm)">
                      <InputNumber min={0} className="!w-full !rounded-xl" controls={false} placeholder="Chiều cao" />
                    </Form.Item>
                    <Form.Item name="weight_kg" label="Cân nặng (kg)">
                      <InputNumber step={0.1} min={0} className="!w-full !rounded-xl" controls={false} placeholder="Cân nặng" />
                    </Form.Item>
                    <Form.Item name="activity_level" label="Mức vận động">
                      <Select className="!rounded-xl" placeholder="Chọn mức vận động" options={[
                        { value: 'sedentary', label: 'Ít vận động' },
                        { value: 'light', label: 'Nhẹ' },
                        { value: 'moderate', label: 'Trung bình' },
                        { value: 'active', label: 'Cao' },
                        { value: 'very_active', label: 'Rất cao' },
                      ]} />
                    </Form.Item>
                    <Form.Item name="goal" label="Mục tiêu">
                      <Select className="!rounded-xl" placeholder="Chọn mục tiêu" options={[
                        { value: 'lose', label: 'Giảm cân' },
                        { value: 'maintain', label: 'Duy trì' },
                        { value: 'gain', label: 'Tăng cân' },
                      ]} />
                    </Form.Item>
                  </div>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={update.isPending} size="large" block className="!rounded-xl">
                      {update.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </Button>
                  </Form.Item>
                  {update.isError && (
                    <p className="text-sm text-rose-500">{(update.error as Error).message}</p>
                  )}
                </Form>
              ),
            },
          ]} />
        </Card>
      </div>
    </ConfigProvider>
  );
}
