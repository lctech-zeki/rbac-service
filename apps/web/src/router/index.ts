import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('@/components/common/AppLayout.vue'),
      children: [
        { path: '', redirect: '/users' },
        { path: 'users', name: 'users', component: () => import('@/views/users/UsersView.vue') },
        { path: 'roles', name: 'roles', component: () => import('@/views/roles/RolesView.vue') },
        {
          path: 'permissions',
          name: 'permissions',
          component: () => import('@/views/permissions/PermissionsView.vue'),
        },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.isLoggedIn) return { name: 'login' }
})

export default router
