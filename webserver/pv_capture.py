import time
import threading
import os
from datetime import datetime
import signal
import sys

# Print debugging information about Python environment
print(f"PV_CAPTURE: Python version: {sys.version}")
print(f"PV_CAPTURE: Python path: {sys.path}")

# Gracefully handle module imports
try:
    import requests
    print(f"PV_CAPTURE: Successfully imported requests version: {requests.__version__}")
except ImportError as e:
    print(f"WARNING: requests module not available. PV capture will not work. Error: {e}")
    # Try alternative import methods
    try:
        import importlib.util
        spec = importlib.util.find_spec("requests")
        if spec is not None:
            print(f"PV_CAPTURE: requests module found at {spec.origin} but failed to import")
        else:
            print("PV_CAPTURE: requests module not found in sys.path")
    except Exception as e2:
        print(f"PV_CAPTURE: Error while checking for requests module: {e2}")
    requests = None

try:
    # Try importing directly from bs4
    from bs4 import BeautifulSoup
    import bs4
    print(f"PV_CAPTURE: Successfully imported BeautifulSoup version: {bs4.__version__}")
except ImportError as e:
    try:
        # Fall back to using just bs4 and the BeautifulSoup class within it
        import bs4
        BeautifulSoup = bs4.BeautifulSoup
        print(f"PV_CAPTURE: Successfully imported bs4 version: {bs4.__version__}")
    except ImportError as e2:
        print(f"WARNING: BeautifulSoup module not available. PV capture will not work. Error: {e} / {e2}")
        try:
            import importlib.util
            spec = importlib.util.find_spec("bs4")
            if spec is not None:
                print(f"PV_CAPTURE: bs4 module found at {spec.origin} but failed to import")
            else:
                print("PV_CAPTURE: bs4 module not found in sys.path")
        except Exception as e3:
            print(f"PV_CAPTURE: Error while checking for bs4 module: {e3}")
        BeautifulSoup = None

try:
    import csv
    print("PV_CAPTURE: Successfully imported csv module")
except ImportError as e:
    print(f"WARNING: csv module not available. PV capture will not work. Error: {e}")
    csv = None

from collections import defaultdict

# Global variables
active_capture = False
capture_thread = None
capture_rate = 500  # Default sample rate in milliseconds
capture_files = []

def start_capture(sample_rate=500):
    """Start a new PV capture session with the specified sample rate"""
    global active_capture, capture_thread, capture_rate
    
    # Check if required modules are available
    if None in [requests, BeautifulSoup, csv]:
        return False, "Cannot start PV capture: Missing required Python modules. Install requests, beautifulsoup4 packages."
    
    if active_capture:
        return False, "PV capture is already running"
    
    # Set up capture parameters
    capture_rate = sample_rate
    
    # Create a capture directory if it doesn't exist
    capture_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pv_captures')
    if not os.path.exists(capture_dir):
        os.makedirs(capture_dir)
    
    # Start the capture thread
    active_capture = True
    capture_thread = threading.Thread(target=capture_process_variables)
    capture_thread.daemon = True
    capture_thread.start()
    
    return True, f"Process variable capture started with sample rate {sample_rate}ms"

def stop_capture():
    """Stop the currently running PV capture session"""
    global active_capture, capture_thread
    
    if not active_capture:
        return False, "No active PV capture to stop"
    
    # Signal the thread to stop
    active_capture = False
    if capture_thread:
        # Give the thread a moment to finish
        time.sleep(0.5)
        capture_thread = None
    
    return True, "Process variable capture stopped"

def get_capture_status():
    """Get the current status of PV capture"""
    global active_capture, capture_rate
    
    if active_capture:
        return True, f"Active capture running at {capture_rate}ms sample rate"
    else:
        return False, "No active capture"

def get_capture_files():
    """Get a list of available PV capture files"""
    capture_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pv_captures')
    
    if not os.path.exists(capture_dir):
        return []
    
    # Get a list of all csv files in the directory
    files = []
    for filename in os.listdir(capture_dir):
        if filename.endswith('.csv'):
            filepath = os.path.join(capture_dir, filename)
            stats = os.stat(filepath)
            mtime = stats.st_mtime
            size = stats.st_size
            
            # Format the modification time and size for display
            mtime_str = datetime.fromtimestamp(mtime).strftime('%Y-%m-%d %H:%M:%S')
            
            if size < 1024:
                size_str = f"{size} B"
            elif size < 1024 * 1024:
                size_str = f"{size / 1024:.1f} KB"
            else:
                size_str = f"{size / (1024 * 1024):.1f} MB"
            
            files.append({
                'filename': filename,
                'path': filepath,
                'mtime': mtime,
                'mtime_pretty': mtime_str,
                'size': size,
                'size_pretty': size_str
            })
    
    # Sort by modification time, newest first
    files.sort(key=lambda x: x['mtime'], reverse=True)
    return files

def capture_process_variables():
    """Worker function to capture process variables from the monitoring page"""
    global active_capture, capture_rate
    
    # Check if required modules are available
    if None in [requests, BeautifulSoup, csv]:
        print("ERROR: Required modules (requests, BeautifulSoup, or csv) not available. Cannot start PV capture.")
        active_capture = False
        return ["ERROR: Required Python modules not available. Install requests, beautifulsoup4, and csv modules."]
    
    # URL and credentials setup
    login_url = 'http://localhost:8080/login'
    monitor_url = 'http://localhost:8080/monitor-update?mb_port=502'
    credentials = {
        'username': 'openplc',
        'password': 'openplc'
    }
    
    # Initialize data storage
    point_name = ['Timestamp']
    point_type = [' ']
    point_location = [' ']
    point_value = ['Current time']
    firstrun = False
    
    # Generate a unique filename for this capture session
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"pv_capture_{timestamp}.csv"
    filepath = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pv_captures', filename)
    
    # Create a capture log for status updates
    capture_log = []
    capture_log.append(f"Starting capture at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    capture_log.append(f"Sample rate: {capture_rate}ms")
    
    try:
        # Start a session
        with requests.Session() as session:
            # Login
            response = session.post(login_url, data=credentials, timeout=10)
            
            if response.ok:
                capture_log.append("Login successful")
                
                # Main capture loop
                while active_capture:
                    try:
                        # Get monitor data
                        home_response = session.get(monitor_url, timeout=10)
                        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]
                        
                        # Parse the HTML
                        soup = BeautifulSoup(home_response.text, 'html.parser')
                        table = soup.find('table')
                        if not table:
                            capture_log.append("Error: Could not find variable table in monitoring page")
                            time.sleep(capture_rate / 1000)
                            continue
                            
                        result = []
                        allrows = table.findAll('tr')
                        for row in allrows:
                            result.append([])
                            allcols = row.findAll('td')
                            for col in allcols:
                                thestrings = [str(s) for s in col.findAll(string=True)]
                                thetext = ''.join(thestrings)
                                result[-1].append(thetext)
                        
                        point_value = [f"{current_time}"]
                        if not firstrun:
                            for row in result:
                                if len(row) >= 5:
                                    point_name.append(row[0])
                                    point_type.append(row[1])
                                    point_location.append(row[2])
                                    point_value.append(row[4])
                            firstrun = True
                            with open(filepath, 'w', newline='') as csvfile:
                                writer = csv.writer(csvfile)
                                writer.writerow(point_name)
                                writer.writerow(point_type)
                                writer.writerow(point_location)
                                writer.writerow(point_value)
                            capture_log.append(f"Initialized capture with {len(point_name)-1} variables")
                        else:
                            for row in result:
                                if len(row) >= 5:
                                    point_value.append(row[4])
                            with open(filepath, 'a', newline='') as csvfile:
                                writer = csv.writer(csvfile)
                                writer.writerow(point_value)
                        
                        # Sleep for the specified sample rate
                        time.sleep(capture_rate / 1000)
                        
                    except requests.exceptions.Timeout:
                        capture_log.append("Warning: Request timed out, retrying...")
                        time.sleep(capture_rate / 1000)
                        continue
                    except Exception as e:
                        capture_log.append(f"Warning: Error during polling: {e}")
                        time.sleep(capture_rate / 1000)
                        continue
            else:
                capture_log.append(f"Error: Login failed with status code {response.status_code}")
                
    except requests.exceptions.ConnectionError:
        capture_log.append("Error: Could not connect to the server. Please check if the server is running.")
    except requests.exceptions.Timeout:
        capture_log.append("Error: Initial login timed out. Server is taking too long to respond.")
    except Exception as e:
        capture_log.append(f"An unexpected error occurred: {e}")
    finally:
        # Create a static directory for direct file access if it doesn't exist
        static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'pv_files')
        if not os.path.exists(static_dir):
            os.makedirs(static_dir)
        
        # Copy the capture file to the static directory for direct download
        if os.path.exists(filepath):
            import shutil
            static_file = os.path.join(static_dir, filename)
            shutil.copy2(filepath, static_file)
            os.chmod(static_file, 0o644)  # Make it readable by the web server
            
        # Add completion message to log
        capture_log.append(f"Capture completed at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        active_capture = False
    
    return capture_log 