import { NavLink, useNavigate } from 'react-router-dom';
import { Layout as AntLayout, Menu, Dropdown, Button } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useCurrentUser } from '../hooks/useCurrentUser';

const { Header, Content } = AntLayout;

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/food', label: 'Nhật ký ăn uống' },
  { to: '/daily', label: 'Cân nặng & Nước' },
  { to: '/profile', label: 'Hồ sơ' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { userId, clearUser } = useCurrentUser();
  const navigate = useNavigate();

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Hồ sơ cá nhân',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      onClick: () => {
        clearUser();
        navigate('/login');
      },
    },
  ];

  return (
    <AntLayout className="min-h-screen bg-slate-50">
      <Header
        className="sticky top-0 z-50 flex items-center justify-between bg-white px-6 shadow-sm"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center gap-8">
          <span className="cursor-pointer text-xl font-bold text-emerald-600" onClick={() => navigate('/')}>
            Health Tracker
          </span>
          <Menu
            mode="horizontal"
            selectedKeys={links.filter(l => {
              if (l.end) return window.location.pathname === l.to;
              return window.location.pathname.startsWith(l.to);
            }).map(l => l.to)}
            items={links.map(l => ({
              key: l.to,
              label: <NavLink to={l.to} end={l.end} className="text-sm font-medium">{l.label}</NavLink>,
            }))}
            className="!min-w-0 !border-b-0 !bg-transparent"
            style={{ flex: 1, minWidth: 0 }}
          />
        </div>
        {userId != null && (
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
            <Button type="text" icon={<UserOutlined />} className="!text-slate-600 hover:!bg-slate-100">
              Tài khoản
            </Button>
          </Dropdown>
        )}
      </Header>
      <Content className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </Content>
    </AntLayout>
  );
}
