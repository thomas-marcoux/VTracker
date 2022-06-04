"""
Render, utilities, and REST API functions for the Network Analysis page.

"""

# General imports
import json
import logging
import random

# Django imports
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import render
from django.template.loader import render_to_string
from django.views.decorators.csrf import csrf_exempt


# Elastic Search imports
from elasticsearch import Elasticsearch
from elasticsearch_dsl import Search, Q as ES_Q
from django.conf import settings

# Sub packages
from ..models import RelatedVideos
from .genericUtilities import convertToDate, dictionaryMerge, getMaxDictKey, parseRequest
from .queryUtils import getDateRangeCommentsRequest, getDateRangeVideoRequest, getLatestDailyVideosRequest, \
    getTrackerVideoIDs, getTrackerDetails, getVideos, getElasticSearchClient
from .wrappers import ajax_post_required
from django.http import HttpResponse, HttpResponseNotFound
import os


es_index = settings.ELASTICSEARCH_INDICES['es_indices']
es_client = getElasticSearchClient()
logger = logging.getLogger(__name__)


### Render

@login_required
def networkAnalysis(request, tracker_id):
    """Return a render of the Network Analysis Page given the ID of the tracker. """
    tracker_data = getTrackerDetails(request, tracker_id, with_date_range=True)
    return render(request, 'youtube_tracker/networkAnalysis.html',
                  {
                      'trackerData': tracker_data,
                      'breadCrumbTrail': {'Dashboard': 'dashboardAnalytics'},
                      'pageTitle': 'Related Videos',
                      'JSONContextData': json.dumps(tracker_data, indent=4, sort_keys=True, default=str),
                  })

# @login_required
# def networkAnalysis(request, tracker_id):
#     """Return a render of the Network Analysis Page given the ID of the tracker. """
#     tracker_data = getTrackerDetails(request, tracker_id, with_date_range=True)
#     return render(request, 'index.html')


### AJAX Calls - Network Graph


@ajax_post_required
def networkAnalysisGraph(request):
    """Return data for network graph."""
    request_args = parseRequest(request)
    video_ids = getTrackerVideoIDs(request_args['tracker_id'])
    values = ['video_id', 'parent_video', 'title', 'thumbnails_medium_url', 'published_date']
    related_videos_search = Search(index=es_index['es-related_videos'], using=es_client)
    related_videos_query = related_videos_search \
        .filter(ES_Q({'terms': {'parent_video.keyword': video_ids}})) \
        .source(values)
    nodes = {}
    edges = []
    minimum_occurence = 2

    # Many of the tracker's videos may not be present in the related videos table. This will reveal them
    # minimum_occurence = 0
    videos = getVideos(video_ids, values=['video_id', 'video_title', 'thumbnails_medium_url'])
    for video in videos:
        nodes[video['video_id']] = {
                'id': video['video_id'],
                'title': video['video_title'],
                'image': video['thumbnails_medium_url'],
                'value': 0,
            }


    for hits in related_videos_query.scan():
        if hits.video_id not in nodes:
            nodes[hits.video_id] = {
                'id': hits.video_id,
                'title': hits.title,
                'shape': 'circularImage',
                'image': hits.thumbnails_medium_url,
                'value': 0,
            }
        nodes[hits.video_id]['value'] += 1
        edges.append({'from': hits.parent_video, 'to': hits.video_id})
    # nodes = {k: v for k, v in nodes.items() if v['value'] >= minimum_occurence}
    nodes = [v for _, v in nodes.items() if v['value'] >= minimum_occurence]
    # edges = [edge for edge in edges if edge['from'] in nodes.keys()]
    # nodes = nodes.values()
    # related_videos_query.aggs.bucket("group_by_video", 'terms', field='video_id.keyword')
    # res = related_videos_query.execute()
    # for hits in res.aggregations.group_by_video.buckets:
    #     if hits.doc_count > 0:
    #         video = RelatedVideos.objects.filter(video_id=hits.key).values(*values).first()
    #         if video:
    #             related_video_map[hits.key] = video
    #             related_video_map[hits.key]["related_to_count"] = hits.doc_count
    # related_video_map = list(v for _, v in related_video_map.items())
    print("real nodes", len(nodes), len(edges))
    return JsonResponse({'series': {'nodes': nodes, 'edges': edges}})


@csrf_exempt
def chartData(request):
    body_unicode = request.body.decode('utf-8')
    body_data = json.loads(body_unicode)
    trackerId = body_data['tracker_id']

    video_ids = getTrackerVideoIDs(trackerId)

    values = ['video_id', 'parent_video', 'title', 'thumbnails_medium_url', 'published_date']
    related_videos_search = Search(index=es_index['es-related_videos'], using=es_client)
    related_videos_query = related_videos_search \
        .filter(ES_Q({'terms': {'parent_video.keyword': video_ids}})) \
        .source(values)
    nodes = {}
    edges = []
    minimum_occurence = 2

    # Many of the tracker's videos may not be present in the related videos table. This will reveal them
    # minimum_occurence = 0
    videos = getVideos(video_ids, values=['video_id', 'video_title', 'thumbnails_medium_url'])

    data =  {'network' : {'items':  [], 'links': []}}

    for video in videos:
        nodes[video['video_id']] = {
                "id": video['video_id'],
                "label": video['video_title'],
                "weights" : 1
            }


    for hits in related_videos_query.scan():
        if hits.video_id not in nodes:
            nodes[hits.video_id] = {
                "id": hits.video_id,
                "label": hits.title,
                "weights" : 1

            }
        else:
            nodes[hits.video_id]["weights"] += 1
        
        if hits.parent_video in nodes:
            data["network"]["links"].append({"source_id":  hits.parent_video, "target_id": hits.video_id, "strength": random.randint(1, 6)})

    items = [v for _, v in nodes.items()]
    data["network"]["items"]  = items
    json_object = json.dumps(data, indent = 4) 
    response = HttpResponse(json_object, content_type='application/json')
    response['Content-Disposition'] = 'attachment; filename="file.json"'
    return response
