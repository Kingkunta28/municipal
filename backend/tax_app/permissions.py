"""
Custom permissions for Municipal Tax System
"""
from rest_framework import permissions


class IsAdministrator(permissions.BasePermission):
    """Permission check for Administrator role"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role == 'Administrator'


class IsTaxpayer(permissions.BasePermission):
    """Permission check for Taxpayer role"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role == 'Taxpayer'


class IsTaxpayerOrReadOnly(permissions.BasePermission):
    """Allow read access to all, write access only to Taxpayer"""
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role == 'Taxpayer'


class IsOwnerOrAdministrator(permissions.BasePermission):
    """Allow access to owner or administrator"""
    
    def has_object_permission(self, request, view, obj):
        # Admin can access everything
        if request.user.role == 'Administrator':
            return True
        
        # Check if user is the owner
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        if hasattr(obj, 'email'):
            return obj.email == request.user.email
        
        return False


class CanAccessAdmin(permissions.BasePermission):
    """Permission to access admin endpoints"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role == 'Administrator'
