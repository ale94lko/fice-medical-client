const routes = [
  {
    path: '/',
    component: () => import('layouts/GuestLayout.vue'),
    meta: { guest: true },
    children: [
      { path: '', redirect: '/login' },
      {
        path: 'login',
        name: 'Login',
        component: () => import('pages/LoginPage.vue'),
      },
      {
        path: 'register',
        name: 'Register',
        component: () => import('pages/RegisterPage.vue'),
      },
      {
        path: 'verify-email',
        name: 'VerifyEmail',
        component: () => import('pages/VerifyEmailPage.vue'),
      },
      {
        path: 'invitation',
        name: 'Invitation',
        component: () => import('pages/InvitationPage.vue'),
      },
      {
        path: 'forgot-password',
        name: 'ForgotPassword',
        component: () => import('pages/ForgotPasswordPage.vue'),
      },
      {
        path: 'reset-password',
        name: 'ResetPassword',
        component: () => import('pages/ResetPasswordPage.vue'),
      },
    ],
  },
  {
    path: '/',
    component: () => import('layouts/PortalLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('pages/DashboardPage.vue'),
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('pages/ProfilePage.vue'),
      },
      {
        path: 'appointments',
        name: 'Appointments',
        component: () => import('pages/ComingSoonPage.vue'),
        meta: { titleKey: 'appointments' },
      },
      {
        path: 'documents',
        name: 'Documents',
        component: () => import('pages/ComingSoonPage.vue'),
        meta: { titleKey: 'documents' },
      },
      {
        path: 'consents',
        name: 'Consents',
        component: () => import('pages/ComingSoonPage.vue'),
        meta: { titleKey: 'consents' },
      },
      {
        path: 'forms',
        name: 'Forms',
        component: () => import('pages/ComingSoonPage.vue'),
        meta: { titleKey: 'forms' },
      },
      {
        path: 'messages',
        name: 'Messages',
        component: () => import('pages/ComingSoonPage.vue'),
        meta: { titleKey: 'messages' },
      },
      {
        path: 'security',
        name: 'Security',
        component: () => import('pages/ComingSoonPage.vue'),
        meta: { titleKey: 'security' },
      },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
