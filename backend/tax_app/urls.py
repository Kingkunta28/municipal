
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView, LoginView, RefreshTokenView, MeView, ProfileView,
    DashboardSummaryView, PaymentRequestViewSet, AdminMetricsView,
    AdminUserListView, AdminUserDeleteView, AdminUserStatusUpdateView,
    AdminUnpaidUsersView, TaxTypeViewSet, TaxAccountViewSet
)

router = DefaultRouter()
router.register(r'tax-types', TaxTypeViewSet)
router.register(r'tax-accounts', TaxAccountViewSet, basename='tax-accounts')
router.register(r'payments', PaymentRequestViewSet, basename='payments')

urlpatterns = [
    # Auth endpoints
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', MeView.as_view(), name='me'),
    
    # Profile endpoints
    path('profile/', ProfileView.as_view(), name='profile'),
    
    # Dashboard endpoints
    path('dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard_summary'),
    
    # Admin endpoints
    path('admin/metrics/', AdminMetricsView.as_view(), name='admin_metrics'),
    path('admin/users/', AdminUserListView.as_view(), name='admin_users'),
    path('admin/users/<int:pk>/delete/', AdminUserDeleteView.as_view(), name='admin_user_delete'),
    path('admin/users/<int:pk>/status/', AdminUserStatusUpdateView.as_view(), name='admin_user_status'),
    path('admin/unpaid-users/', AdminUnpaidUsersView.as_view(), name='admin_unpaid_users'),
    
    # Include router URLs
    path('', include(router.urls)),
]
