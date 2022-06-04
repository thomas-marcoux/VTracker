from django.shortcuts import render, redirect
from django.db.models import Count, Prefetch
from django.contrib.auth import authenticate,login,logout
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, Http404, JsonResponse
from django.core.serializers.json import DjangoJSONEncoder
from django.db.models.aggregates import Max
from django.db.models import Q , Count, F, Value #, Subquery, OuterRef
from django.db import connection

# from youtube_tracker.forms import loginForm
from youtube_tracker.models import Videos,Channels,ChannelsDaily,VideosDaily,AbstractBaseUser,User,Tracker, TrackerRelationship

from ..forms import login_Form
from ..models import CrawlerTask, YtCrawlerPipeline, Keywords
from .lib import contentIsURL, getIDfromURL, splitInput, splitKeywords

import datetime, json, logging
import requests

logger = logging.getLogger(__name__)

@login_required(login_url='/YTAdminConsole/login/')
def dashBoard(request):
	callsMade = 0
	totalCalls = 0
	token='fc7ea3a02234f4589f5042bfcf9d637f'
	response = requests.get('https://api.diffbot.com/v3/account?token='+token)
	if response.status_code == 200:
		content =  json.loads(response.content.decode())
		totalCalls = content['planCalls']
		callsMade = sum( i['calls'] for i in content['apiCalls'] )

	context = {"totalCalls" :  totalCalls, "callsMade" : callsMade }
	return render(request, 'YTAdminConsole/dashBoard.html', context)

def dashboardStats(request):	
	if request.GET.get('type') =='Channel' :
		chan = get_channel_obj()
		count_stats ={ 'Channel': chan }
		return JsonResponse (
			{
				'countStatsJson': json.dumps(count_stats, indent=4, sort_keys=True,default=str)
			})
	elif request.GET.get('type') =='Video' :
		vid = get_video_obj() 
		count_stats ={ 'Video': vid }
		return JsonResponse (
			{
				'countStatsJson': json.dumps(count_stats, indent=4, sort_keys=True,default=str)
			})
	else : 
		ky =  get_keyword_obj()
		count_stats ={ 'Keyword': ky }
		return JsonResponse (
			{
				'countStatsJson': json.dumps(count_stats, indent=4, sort_keys=True,default=str)
			})

@login_required(login_url='/YTAdminConsole/login/')
def search(request):
	video_list = Videos.objects.all()[:10]
	context = { 'video_list': video_list }
	return render(request, 'YTAdminConsole/search.html', context)

@login_required(login_url='/YTAdminConsole/login/')
def exportData(request):
	return_fields = {'trackers' : None, 'ch_attr':None , 'vid_attr':None}
	try: 
		trck_list = []
		trck_names= Tracker.objects.all().values_list('tracker_id','tracker_name')
		for names in trck_names:
			trck_list.append({"Key":names[0], "Value":names[1]})	
		return_fields['trackers']	= 	trck_list

		ch_list = []
		ch_attr = Channels._meta.get_fields() + ChannelsDaily._meta.get_fields()
		for attrs in ch_attr:
			if attrs.auto_created or  attrs.primary_key:
				pass
			else :
				ch_list.append({"Key":attrs.column, "Value":attrs.verbose_name})		
		return_fields['ch_attr']	= 	ch_list

		vid_list = []
		vid_attr = Videos._meta.get_fields() + VideosDaily._meta.get_fields()
		for attrs in vid_attr:
			if attrs.auto_created  or  attrs.primary_key:
				pass
			else :	
				vid_list.append({"Key":attrs.column, "Value":attrs.verbose_name})
		return_fields['vid_attr']	= 	vid_list

	except Exception as e:
		logger.error("Error", e)
		print(e)
	return render(request, 'YTAdminConsole/exportData.html', return_fields)

@login_required(login_url='/YTAdminConsole/login/')
def stats(request):
	if request.method == "GET":
		status = request.GET.get('status')
		type_id = request.GET.get('type')
		total = request.GET.get('total')
		title = "Crawled"
		if (type_id == 'Keyword' ):
			if status=="crawling":
				title= "In Progress"
			elif status =="not_crawled":
				title = "Keyword Set"
			elif status=="not_crawlable":
				title="Troublesome Keywords "
			else:
				title="Crawled"
			return render(request, 'YTAdminConsole/keyword-stat-details.html',{"title":title, "status":status, "id":type_id, "total":total})
		else :
			if status=="crawling":
				title= "In Progress"
			elif status =="not_crawled":
				title = "To be Crawled"
			elif status=="not_crawlable":
				title="Troublesome "
			else:
				title="Crawled"
			return render(request, 'YTAdminConsole/stat-details.html',{"title":title, "status":status, "id":type_id, "total":total})
	else :
		return render(request, 'YTAdminConsole/stat-details.html',{"status":'Crawled', "id":"Channels"})

def login_console(request):
	return render(request, 'YTAdminConsole/login.html',{})

def login_view(request):
	logger.info("Begin Logging YT Admin Login Page")
	if not request.is_ajax():
		raise Http404
	if request.method == 'POST':
		form = login_Form(request.POST)
		logger.info("POST Login Form")
		if form.is_valid():
			data=form.cleaned_data
			user=authenticate(username=data['email'],password=data['password'])
			if user is not None:
				if user.is_staff:
					login(request,user)
				
					go_to_page = '/YTAdminConsole/dashboard'
					if request.GET.get('next'): 
						go_to_page = request.GET.get('next')

					HttpResponse.status_code = 200
					logger.info("Pass: Request has succeeded")
					response = {'status': 1, 'message': ("Ok"), 'url':go_to_page} 
				else:
					response = {'status': 0, 'message': ("You do not have permission to access Admin Console"), 'url':'' }	
					HttpResponse.status_code = 401
					logger.error("Failed: No permission to access Admin Console")
			else:
				response = {'status': 0, 'message': ("Invalid username or password"), 'url':'' }
				logger.error("Failed: Invaild username or password")	
				HttpResponse.status_code = 401

			return HttpResponse(json.dumps(response), content_type='application/json')

	else:
		form=login_Form()
	
	HttpResponse.status_code = 401
	response = {'status': 0, 'message': ("Incorrect username or password"), 'url':'' }
	return HttpResponse(json.dumps(response), content_type='application/json')
	
@login_required(login_url='/YTAdminConsole/login/')
def logout_view(request):
	logout(request) 
	return redirect('/YTAdminConsole')

def get_channel_obj():
	chan_stat = {'crawled' : 0,'crawling' : 0,'not_crawled' : 0,'not_crawlable' : 0}
	try:
		chan_stat['crawled'] = Channels.objects.count()
		chan_stat['not_crawled'] = YtCrawlerPipeline.objects.filter(content_type='channel',status='not_crawled').count()
		chan_stat['crawling'] = YtCrawlerPipeline.objects.filter(content_type='channel',status='crawling').count()
		chan_stat['not_crawlable'] = YtCrawlerPipeline.objects.filter(content_type='channel',status='not_crawlable').count()
	except Exception as e:
		logger.error("Error", e)
		print(e)
	return chan_stat

def get_video_obj():
	vid_stat  = {'crawled' : 0,'crawling' : 0,'not_crawled' : 0,'not_crawlable' : 0}
	try:
		vid_stat['crawled'] =  Videos.objects.count()
		vid_stat['not_crawled'] = YtCrawlerPipeline.objects.filter(content_type='video',status='not_crawled').count()
		vid_stat['crawling']  = YtCrawlerPipeline.objects.filter(content_type='video',status='crawling').count()
		vid_stat['not_crawlable']  = YtCrawlerPipeline.objects.filter(content_type='video',status='not_crawlable').count()
	except Exception as e:
		logger.error("Error", e)
		print(e)
	return vid_stat

def get_keyword_obj():
	keyword_stat = {'crawled' : 0 ,'crawling' : 0,'not_crawled' : 0,'not_crawlable' : 0}
	try:
		# queryset = Keywords_QuerySet()
		keyword_stat['crawled'] = Videos.objects.select_related('source_id').filter(source_id__content_type='keyword').count()		

		# Keywords in YTCrawlerpipeline with status 'crawled' will be shown in the 'crawling' section of the dashboard.
		#  Keywords are always in 'crawling' mode.
		keyword_stat['crawling'] = YtCrawlerPipeline.objects.filter(content_type='keyword',status='crawled').count()
		
		keyword_stat['not_crawled'] = YtCrawlerPipeline.objects.filter(content_type='keyword',status='not_crawled').count()
		keyword_stat['not_crawlable'] = YtCrawlerPipeline.objects.filter(content_type='keyword',status='not_crawlable').count()

	except Exception as e:
		logger.error("Error", e)
		print(e)

	return  keyword_stat


def statsByStatus(request):
	try:
		if request.GET.get('status') =='crawled':
			if request.GET.get('type') =='Channel':
				jsonthis = Channels_get_all(request.GET)
			elif request.GET.get('type') =='Video':
				jsonthis = Videos_get_all(request.GET)		
			elif request.GET.get('type') =='Keyword':
				jsonthis = Keywords_get_all(request.GET)
		else:
			jsonthis = Content_get_selected(request.GET, request.GET.get('status'), request.GET.get('type').lower())

		return HttpResponse(json.dumps(jsonthis,cls=DjangoJSONEncoder), content_type='application/json')
	except Exception as e:
		print(e)
		logger.error("Error", e)
		return HttpResponse(None, content_type='application/json')

## use select_related() for OneToOne field, 'forward' ForeignKey relations . Ex:  VideosDaily to Videos
## use prefetch_related() for ManyToMany 'reverse' ForeignKey relations. Video to VideosDaily [multiple daily id's]

def Channels_QuerySet():
	## FOR NOW , THIS WILL DO 
	## get all channel ID's from Channels
	## get max channel DAILY_ID from ChannelsDaily
	## Filter DAILY_ID's from ChannelsDaily
	Channels_main_list = Channels.objects.all()
	channels_daily_list = ChannelsDaily.objects.filter(channel_id__in = Channels_main_list.values_list('channel_id'))
	chan_daily_list = channels_daily_list.values('channel_id').annotate(max_id=Max('channels_daily_id'))
	chan_daily_list = ChannelsDaily.objects.filter(channels_daily_id__in = chan_daily_list.values_list('max_id'))
	
	return chan_daily_list
	

def Videos_QuerySet():
    ## NEED TO FIND A BETTER WAY TO DO THIS 
	Videos_main_list = Videos.objects.all()
	videos_daily_list = VideosDaily.objects.filter(video_id__in = Videos_main_list.values_list('video_id'))
	vid_daily_list = videos_daily_list.values('video_id').annotate(max_id=Max(F('videos_daily_id')))
	vid_daily_list = VideosDaily.objects.filter(videos_daily_id__in = vid_daily_list.values_list('max_id'))
	return vid_daily_list

def Keywords_QuerySet():
	logger.info("YT Tracker Admin- Keywords")
	query_set = YtCrawlerPipeline.objects.filter(content_type='keyword', tracker_id__isnull = False).select_related('tracker_id').prefetch_related(
		Prefetch(
			'videos_set'
			, queryset = Videos.objects.filter(source_id__isnull = False)
			, to_attr = 'videosList'
		)
	)

	return query_set

def Keywords_get_all(req):
	json_res = {"draw":0, "recordsTotal":0, "recordsFiltered":0,"data":{}}
	queryset= Videos.objects.select_related('source_id').filter(source_id__isnull=False, source_id__content_type='keyword')
	try:
		if req.get('draw'):
			draw = int(req.get('draw'))
			length = int(req.get('length'))
			start = int(req.get('start'))
			search_value = req.get('search[value]')
			order_column = req.get('order[0][column]')
			order_columnname = req.get('columns['+order_column+'][name]')
			order = req.get('order[0][dir]')
			
			# total = queryset.count()
			total = req.get('total')
			
			count = total
			if search_value:
				queryset = queryset.filter( Q(source_id__content_id__icontains=search_value) | Q(video_title__icontains=search_value) | Q(video_id__icontains=search_value) | Q(category__icontains=search_value) )
				count = queryset.count()
			
			if order == 'desc':
				order_columnname = '-' + order_columnname
			queryset = queryset.order_by(order_columnname)
			queryset = queryset.all()[start:start + length]

			filtered_videos =  list(queryset.values('video_id','video_title','published_date','category', 'added_to_db_time', 'source_id__tracker_id','source_id__content_id'))
			json_data=[] 
			json_res = {"draw":draw, "recordsTotal":total, "recordsFiltered":count,"data":{}}
			for v in filtered_videos:
				json_details = {}
				video_daily_data = VideosDaily.objects.filter(video_id=v['video_id'])
				tracker= Tracker.objects.filter(tracker_id= v['source_id__tracker_id'])
				if bool(tracker):
					tracker = tracker[0].tracker_name
				else :
					tracker = 'N/A'
				json_details={"video_id" : v['video_id'],
							"video_title" : v['video_title'],
							"published_date" : v['published_date'],
							"added_to_db_time" : v['added_to_db_time'],
							"category" : v['category'],
							"source_id__tracker_id" : tracker,
							"source_id__content_id" : v['source_id__content_id'],
							"videos__videosdaily__total_views":"N/A",
							"videos__videosdaily__total_likes":"N/A",
							"videos__videosdaily__total_dislikes":"N/A",
							"videos__videosdaily__total_comments": "N/A",
							"videos__videosdaily__extracted_date": "N/A"
						}
				if bool(video_daily_data):
					video_latest_daily_data = video_daily_data.latest('extracted_date')
					json_details['videos__videosdaily__total_views']  = video_latest_daily_data.total_views
					json_details['videos__videosdaily__total_likes']  = video_latest_daily_data.total_likes
					json_details['videos__videosdaily__total_dislikes']  = video_latest_daily_data.total_dislikes
					json_details['videos__videosdaily__total_comments']  = video_latest_daily_data.total_comments
					json_details['videos__videosdaily__extracted_date']  = video_latest_daily_data.extracted_date
				json_data.append(json_details)
		json_res['data'] = json_data
		# print('Got JSON data ')
	except Exception as e:
		logger.error("Error", e)
		print(e)
	return json_res


def Channels_get_all(req):
	logger.info("YT Tracker Channel")
	queryset = Channels_QuerySet()
	json_res = {}
	total =  Channels.objects.count()
	if req.get('draw'):
		draw = int(req.get('draw'))
		length = int(req.get('length'))
		start = int(req.get('start'))
		search_value = req.get('search[value]')
		order_column = req.get('order[0][column]')
		order_columnname = req.get('columns['+order_column+'][data]')
		order = req.get('order[0][dir]')
		
		count  = total 
		if search_value:
			queryset = queryset.filter(Q(channel_id__channel_title__icontains=search_value)  | Q(channel_id__channel_id__icontains=search_value))
			count = queryset.count()
		if order == 'desc':
			order_columnname = '-' + order_columnname
		queryset = queryset.order_by(order_columnname)[start:start + length]
		json_res = {"draw":draw, "recordsTotal":total, "recordsFiltered":count,"data":{}}
		
		queryset_values = queryset.values('channel_id','channel_id__channel_title', 'channel_id__joined_date', 'channel_id__added_to_db_time','channel_id__location','channel_id__language'
										 , 'total_subscribers', 'total_views', 'total_videos', 'extracted_date')
		json_res['data'] = list(queryset_values)
		
	return json_res

def Videos_get_all_old(req):
	json_res = {}
	queryset = Videos_QuerySet()
	queryset_values = queryset.values('video_id','video_id__video_title','video_id__category', 'video_id__published_date',
										   'total_comments', 'total_views', 'total_likes',  'total_dislikes', 'extracted_date')
	
		
	json_res['data']=list(queryset_values)

	return json_res

def Videos_get_all(req):
# def Videos_serverside(req):
	json_res = {"draw":0, "recordsTotal":0, "recordsFiltered":0,"data":{}}
	queryset= Videos.objects
	try:
		if req.get('draw'):
			draw = int(req.get('draw'))
			length = int(req.get('length'))
			start = int(req.get('start'))
			search_value = req.get('search[value]')
			order_column = req.get('order[0][column]')
			order_columnname = req.get('columns['+order_column+'][name]')
			order = req.get('order[0][dir]')
			total = req.get('total')

			# total = queryset.count()
			count = total
			if search_value:
				queryset = queryset.filter(Q(video_title__icontains=search_value) | Q(video_id__icontains=search_value) | Q(category__icontains=search_value)  )
				count = queryset.count()
			
			if order == 'desc':
				order_columnname = '-' + order_columnname

			queryset = queryset.order_by(order_columnname)
			# queryset = queryset.prefetch_related('videosdaily')
			queryset = queryset.all()[start:start + length]

			filtered_videos =  list(queryset.values('video_id','video_title','category', 'published_date' , 'added_to_db_time'))
			json_data=[] 
			json_res = {"draw":draw, "recordsTotal":total, "recordsFiltered":count,"data":{}}
			for v in filtered_videos:
				json_details = {}
				video_daily_data = VideosDaily.objects.filter(video_id=v['video_id'])
				json_details={"video_id" : v['video_id'],
							"video_id__video_title" : v['video_title'],
							"video_id__published_date" : v['published_date'],
							"video_id__added_to_db_time" : v['added_to_db_time'],
							"video_id__category" : v['category'],
							"total_views":"N/A",
							"total_likes":"N/A",
							"total_dislikes":"N/A",
							"total_comments": "N/A",
							"extracted_date": "N/A"
						}
				if bool(video_daily_data):
					video_latest_daily_data = video_daily_data.latest('extracted_date')
					json_details['total_views']  = video_latest_daily_data.total_views
					json_details['total_likes']  = video_latest_daily_data.total_likes
					json_details['total_dislikes']  = video_latest_daily_data.total_dislikes
					json_details['total_comments']  = video_latest_daily_data.total_comments
					json_details['extracted_date']  = video_latest_daily_data.extracted_date
				json_data.append(json_details)
		json_res['data'] = json_data
	except Exception as e:
		print(e)
		logger.error("Error", e)
	return json_res


def Content_get_selected(req, crawl_status, info_type):
	if (crawl_status=='crawling' and info_type =='keyword'):
		crawl_status = 'crawled'

	json_res={}
	queryset= YtCrawlerPipeline.objects.values('content_id','priority', 'user_id', 'source_id', 'added_to_db_time', 'tracker_id'  )
	queryset= queryset.filter(content_type=info_type, status=crawl_status)
	try:
		total = queryset.count()
		if total != 0 :	
			draw = int(req.get('draw'))
			length = int(req.get('length'))
			start = int(req.get('start'))
			search_value = req.get('search[value]')
			order_field = req.get('order[0][column]')
			order_column =req.get('columns['+req.get('order[0][column]')+'][name]')
			order = req.get('order[0][dir]')

			if search_value:
				queryset = queryset.filter(Q(content_id__icontains=search_value))

			count = queryset.count()
			# django orm '-' -> desc
			if order == 'desc':
				order_column = '-' + order_column

			queryset = queryset.order_by(order_column)[start:start + length]
			json_res = {"draw":draw, "recordsTotal":total, "recordsFiltered":count,"data":None}
			json_data=[]
			try:
				for ch in queryset:
					crawl_start = 'N/A'
					crawl_end ='N/A'
					added_by = 'Youtube Tracker'
					if ch['user_id']:
						added_by = User.objects.get(id=ch['user_id']).first_name        #values_list('first_name')[0][0]
					
					tracker= Tracker.objects.filter(tracker_id= ch['tracker_id'])
					if bool(tracker):
						tracker = tracker[0].tracker_name
					else :
						tracker = 'N/A'
					json_details = {
							"content_id" : ch['content_id'],
							"priority":ch['priority'],
							"user_id": added_by,
							"source_id": ch['source_id'],
							"tracker_id": tracker,
							"added_to_db_time" : ch['added_to_db_time'] 
						}
					json_data.append(json_details)
				json_res['data']=json_data			
			except Exception as e:
				logger.error("Error", e)
				print(e)
		else :
			json_res = {"draw":int(req.get('draw')), "recordsTotal":0, "recordsFiltered":0,"data":[]}
	except Exception as e:
		logger.error("Error", e)
		print(e)
	return json_res

def export_my_data(request):
	try :
		if not request.is_ajax():
			raise Http404
		if request.POST.get('action') == 'default':
			json_data =[]
			json_details = {"Channels": "{:,}".format(Channels.objects.count()), "Videos" : "{:,}".format(Videos.objects.count()) }
			json_data.append(json_details)
			response = HttpResponse(json.dumps(json_details), content_type='application/json')
			return response

		joined_to = datetime.datetime.now().date().isoformat()
		vid_query = Videos.objects
		ch_query =  Channels.objects

		# select channels and videos from these trackers 
		if request.POST.get('trackers[]'):
			trackers = request.POST.getlist('trackers[]')  
			ch_query = getTrackerChannel(trackers )
			vid_query = getTrackerVideos(trackers )
				

		if request.POST.get('endDate'):
			joined_to = request.POST.get('endDate')
		if request.POST.get('startDate'):
			joined_from = request.POST.get('startDate')
			ch_query = ch_query.filter(joined_date__range=[joined_from, joined_to])
			vid_query = vid_query.filter(channel__joined_date__range=[joined_from, joined_to], published_date__range=[joined_from, joined_to])
		else:
			ch_query = ch_query .filter(joined_date__lte=joined_to)
			vid_query = vid_query.filter(channel__joined_date__lte=joined_to, published_date__lte=joined_to)

		
		if request.POST.get('action') == 'count':
			json_data=[]
			ch_Count = ch_query.count()
			vid_Count = vid_query.count()
			json_details = {"Channels": "{:,}".format(ch_Count) , "Videos" : "{:,}".format(vid_Count)}
			json_data.append(json_details)
			response = HttpResponse(json.dumps(json_details), content_type='application/json')
			return response

		if request.POST.get('action') == 'submit':

			json_video=[]
			json_channel=[]
			if request.POST.get('vid_fields[]') :
				vid_fields=request.POST.getlist('vid_fields[]')
				viddaily = VideosDaily.objects
				for vid in vid_query:
					video_obj ={}
					for field in vid_fields:
						f_val =None
						if hasattr(vid, field): 														## check in main Videos table
							f_val = getattr(vid, field)
						else:
							# if vid.videosdaily_set.exists():											## do this when Foreign key is set up
							# 	test = vid.videosdaily_set.latest('videos_daily_id')
							# 	f_val = getattr(test, field)
							if viddaily.filter(video_id=vid.video_id).exists() :                       
								viddaily_id = viddaily.filter(video_id=vid.video_id).latest('videos_daily_id')
								f_val = getattr(viddaily_id, field)
						if type(f_val) == datetime.datetime:
							f_val = f_val.strftime("%d %b '%y %I:%M %p")
						elif type(f_val) == int:
							f_val = "{:,}".format(f_val)
						video_obj[field] = f_val
					json_video.append(video_obj)
			
			if request.POST.get('ch_fields') :
				ch_fields = request.POST.getlist('vid_fields[]')
				chdaily = ChannelsDaily.objects
				for ch in ch_query:
					channel_obj ={}
					for field in ch_fields :
						f_val = None
						if hasattr(ch, field): 															## check in main Channels table
							f_val = getattr(ch,field)
						else:
							if chdaily.filter(channel_id=ch.channel_id).exists() :
								chdaily_id = chdaily.filter(channel_id=ch.channel_id).latest('channels_daily_id')
								f_val = getattr(chdaily_id,field)
						if type(f_val) == datetime.datetime:
							f_val = f_val.strftime("%d %b '%y %I:%M %p")
						elif type(f_val) == int:
							f_val = "{:,}".format(f_val)
						channel_obj[field] = f_val
					json_channel.append(channel_obj)

			response = HttpResponse(json.dumps({"channels":json_channel,"videos":json_video},cls=DjangoJSONEncoder), content_type='application/text')
			return response
			
	except Exception as e:
		logger.error("Error", e)
		print(e)
	return HttpResponse(None, content_type='application/text')

def getTrackerChannel(trackerids ):
	try :
		channels = TrackerRelationship.objects.filter(tracker__in= trackerids,content_type='channel')
		channelIds =   list(channels.values_list('content_id', flat=True).distinct())

		# get channels from YTCrawlerPipeline table  also
		crawlerChannelIds =YtCrawlerPipeline.objects.filter(tracker_id__in= trackerids , content_type ='channel', status = 'crawled')
		if bool(crawlerChannelIds):
			crawlerChannelIds = list(crawlerChannelIds.values_list('content_id', flat=True).distinct())
			channelIds.extend(crawlerChannelIds)

		channel_queryset = Channels.objects.filter(channel_id__in = channelIds )
		return channel_queryset 
	except Exception as e :
		logger.error("Error", e)
		print(e)
		return None 

def getTrackerVideos(trackerids ):
	try :
		videos = TrackerRelationship.objects.filter(tracker__in= trackerids,content_type='video')
		channels = TrackerRelationship.objects.filter(tracker__in= trackerids,content_type='channel')
		videoIds =  list(videos.values_list('content_id', flat=True).distinct())
		channelIds =   list(channels.values_list('content_id', flat=True).distinct())

		# get vids from YTCrawlerPipeline table  also
		crawlerVidIds =YtCrawlerPipeline.objects.filter(tracker_id__in= trackerids , content_type ='video', status = 'crawled')
		if bool(crawlerVidIds):
			crawlerVidIds = list(crawlerVidIds.values_list('content_id', flat=True).distinct())
			videoIds.extend(crawlerVidIds)
	
		crawlerChannelIds =YtCrawlerPipeline.objects.filter(tracker_id__in= trackerids , content_type ='channel', status = 'crawled')
		if bool(crawlerChannelIds):
			
			crawlerChannelIds = list(crawlerChannelIds.values_list('content_id', flat=True).distinct())
			channelIds.extend(crawlerChannelIds)
		
		# print(Channelsids)
		videos_queryset = Videos.objects.filter(Q(video_id__in=videoIds)| Q(channel_id__in=channelIds))
		# print(videos_queryset)

		return videos_queryset 
	except Exception as e :
		logger.error("Error", e)
		print(e)
		return None 
# Update keyword
def update_keyword(request):
	if not request.is_ajax():
		raise Http404
	if request.method == 'GET':
		sid = request.GET.get("sourceid")
		new_keyword = request.GET.get("keyword")
	try:
		# YtCrawlerPipeline.objects.filter(content_type="keyword", source_id = sid ).update(content_id= new_keyword)
		obj = YtCrawlerPipeline.objects.get(source_id=sid)
		obj.content_id = new_keyword
		obj.save()

		return HttpResponse(status=200)
	except Exception as e:
		logger.error("Error", e)
		print(e)
		return HttpResponse(status = 400)

# delete keyword
def delete_keyword(request):
	if not request.is_ajax():
		raise Http404
	if request.method == 'GET':
		sid = request.GET.get("sourceid")
	try:
		obj = YtCrawlerPipeline.objects.get(source_id=sid)
		obj.delete()

		return HttpResponse(status=200)
	except Exception as e:
		logger.error("Error", e)
		print(e)
		return HttpResponse(status = 400)


# delete keyword
def update_priority(request):
	if not request.is_ajax():
		raise Http404
	if request.method == 'GET':
		sid = request.GET.get("sourceid")
		new_priority = request.GET.get("priority")
	try:
		obj = YtCrawlerPipeline.objects.get(source_id=sid )
		obj.priority = new_priority
		obj.save()

		return HttpResponse(status=200)
	except Exception as e:
		logger.error("Error", e)
		print(e)
		return HttpResponse(status = 400)


def test_this(ch_fields,joined_from, joined_to):
    # try:
	with connection.cursor() as cursor:
		query ='''	SELECT MAX(CHANNELS_DAILY_ID) as Daily_id,  '''+	ch_fields +'''
			FROM CHANNELS CH 
			JOIN CHANNELS_DAILY CD ON CH.CHANNEL_ID = CD.CHANNEL_ID
			WHERE JOINED_DATE BETWEEN %s AND %s
			GROUP BY CH.CHANNEL_ID
		'''
		cursor.execute(query,[joined_from, joined_to])
		row = dictfetchall(cursor)
	return row

def test_video(video_fields,joined_from, joined_to, published_from, published_to):
    # try:
	with connection.cursor() as cursor:
		query ='''	SELECT MAX(VIDEOS_DAILY_ID) as Daily_id, '''+	video_fields +'''
			FROM CHANNELS CH 
			JOIN VIDEOS VID ON VID.CHANNEL_ID = CH.CHANNEL_ID
			JOIN VIDEOS_DAILY VH ON VID.VIDEO_ID = VH.VIDEO_ID
			WHERE JOINED_DATE BETWEEN %s AND %s
			AND PUBLISHED_DATE BETWEEN %s AND %s
			GROUP BY VH.VIDEO_ID;
		'''
		cursor.execute(query,[joined_from, joined_to, published_from, published_to])
		row = dictfetchall(cursor)
	return row

def dictfetchall(cursor):
    "Return all rows from a cursor as a dict"
    columns = [col[0] for col in cursor.description]
    return [
        dict(zip(columns, row))
        for row in cursor.fetchall()
    ]
