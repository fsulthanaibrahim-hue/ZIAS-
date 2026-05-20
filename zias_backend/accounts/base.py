from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import viewsets, status
from rest_framework.exceptions import ValidationError, NotFound, PermissionDenied


class SafeAPIView(APIView):
    def handle_exception(self, exc):
        if isinstance(exc, (ValidationError, NotFound, PermissionDenied)):
            return super().handle_exception(exc)

        if hasattr(exc, 'status_code') and exc.status_code in (401, 403):
            return super().handle_exception(exc)

        return Response(
            {"error": "Bad request. Please check your input and try again."},
            status=status.HTTP_400_BAD_REQUEST
        )


class SafeViewSet(viewsets.GenericViewSet):
    def handle_exception(self, exc):
        if isinstance(exc, (ValidationError, NotFound, PermissionDenied)):
            return super().handle_exception(exc)

        if hasattr(exc, 'status_code') and exc.status_code in (401, 403):
            return super().handle_exception(exc)

        return Response(
            {"error": "Bad request. Please check your input and try again."},
            status=status.HTTP_400_BAD_REQUEST
        )