from rest_framework import viewsets
from .models import Student, Mentor, Reviewer
from .serializers import StudentSerializer, MentorSerializer, ReviewerSerializer


class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer


class MentorViewSet(viewsets.ModelViewSet):
    queryset = Mentor.objects.all()
    serializer_class = MentorSerializer


class ReviewerViewSet(viewsets.ModelViewSet):
    queryset = Reviewer.objects.all()
    serializer_class = ReviewerSerializer