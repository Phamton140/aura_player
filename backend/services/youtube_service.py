import os
import yt_dlp
import uuid

class YouTubeService:
    def __init__(self, download_path="temp"):
        self.download_path = download_path
        if not os.path.exists(self.download_path):
            os.makedirs(self.download_path)

    def download_audio(self, url: str):
        """Downloads audio from a YouTube URL preferring m4a format."""
        file_id = str(uuid.uuid4())[:8]
        # Prefer m4a which is often more compatible with Windows audio decoders
        out_template = os.path.join(self.download_path, f"{file_id}.%(ext)s")
        
        ydl_opts = {
            'format': 'bestaudio[ext=m4a]/bestaudio/best', # Prefer m4a
            'outtmpl': out_template,
            'quiet': True,
            'no_warnings': True,
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            ext = info.get('ext', 'm4a')
            filename = os.path.join(self.download_path, f"{file_id}.{ext}")
            return filename, info.get('title', 'Unknown')

    def search_videos(self, query: str, max_results=5):
        """Searches YouTube for a query and returns a list of results."""
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': True,
            'force_generic_utils': True,
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Add 'ytsearch:' prefix to force search
            info = ydl.extract_info(f"ytsearch{max_results}:{query}", download=False)
            results = []
            for entry in info.get('entries', []):
                video_id = entry.get('id')
                title = entry.get('title')
                duration = entry.get('duration')
                uploader = entry.get('uploader')
                
                # STRICT FILTERS:
                # 1. ID must be exactly 11 chars (Standard YouTube Video ID)
                if not video_id or len(video_id) != 11:
                    continue
                
                # 2. Skip entries without duration (channels/playlists usually don't have it in search results)
                if duration is None:
                    continue
                    
                # 3. Skip if title is identical to uploader (often indicates a channel result)
                if title == uploader and duration == 0:
                    continue

                results.append({
                    'id': video_id,
                    'title': title,
                    'url': f"https://www.youtube.com/watch?v={video_id}",
                    'thumbnail': entry.get('thumbnails')[0]['url'] if entry.get('thumbnails') else None,
                    'duration': duration,
                    'channel': uploader
                })
            
            print(f"DEBUG: Found {len(results)} valid videos for query: {query}")
            return results
