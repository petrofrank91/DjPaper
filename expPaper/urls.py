from django.conf.urls import patterns, include, url
from django.views.generic import TemplateView
from expPaper import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = patterns('',
    url(r'^$', views.HomeView.as_view(), name='server_list'),
    url(r'^images/$', views.FieldImageList.as_view()),
    url(r'^images/(?P<pk>[0-9]+)/$', views.FieldImageDetail.as_view()),

    #url(r'^create/$', views.create, name='server_new'),
    #url(r'^edit/(?P<pk>\d+)$', views.update, name='server_edit'),
    #url(r'^delete/(?P<pk>\d+)$', views.delete, name='server_delete'),
    # url(r'^create2/$', views.ServerCreate.as_view(), name='server_new2'),
    # url(r'^edit/(?P<pk>\d+)$', views.ServerUpdate.as_view(), name='server_edit'),
    # url(r'^delete/(?P<pk>\d+)$', views.ServerDelete.as_view(), name='server_delete'),
) + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
