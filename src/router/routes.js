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
        path: 'resend-verification',
        name: 'ResendVerification',
        component: () => import('pages/ResendVerificationPage.vue'),
      },
      {
        path: 'reset-password',
        name: 'ResetPassword',
        component: () => import('pages/ResetPasswordPage.vue'),
      },
    ],
  },
  {
    path: '/select-location',
    component: () => import('layouts/GuestLayout.vue'),
    meta: { requiresAuth: true, locationPick: true },
    children: [
      {
        path: '',
        name: 'SelectLocation',
        component: () => import('pages/SelectLocationPage.vue'),
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
        component: () => import('pages/AppointmentsPage.vue'),
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
        component: () => import('pages/ConsentsPage.vue'),
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
    path: '/appointments/:id/telehealth',
    name: 'PortalTelehealth',
    meta: { requiresAuth: true },
    component: () => import('pages/TelehealthMeetPage.vue'),
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
