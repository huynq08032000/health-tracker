import type { ThemeConfig } from 'antd';

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: '#10b981',
    colorSuccess: '#10b981',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#3b82f6',
    borderRadius: 12,
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f8fafc',
    colorBorder: '#e2e8f0',
    colorText: '#1e293b',
    colorTextSecondary: '#64748b',
    controlHeight: 40,
  },
  components: {
    Button: {
      primaryShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.39)',
      borderRadius: 10,
    },
    Card: {
      borderRadiusLG: 16,
    },
    Input: {
      borderRadius: 10,
      controlHeight: 40,
    },
    Select: {
      borderRadius: 10,
      controlHeight: 40,
    },
    InputNumber: {
      borderRadius: 10,
      controlHeight: 40,
    },
    DatePicker: {
      borderRadius: 10,
      controlHeight: 40,
    },
    Progress: {
      borderRadius: 8,
    },
  },
};
