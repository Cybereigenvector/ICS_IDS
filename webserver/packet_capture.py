#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import subprocess
import datetime
import signal
import fcntl
import time

# Directory to store captured pcap files
CAPTURE_DIR = 'packet_captures'
# File to track running capture processes
CAPTURE_PID_FILE = 'packet_capture.pid'
# Path to tcpdump binary
TCPDUMP_PATH = '/usr/bin/tcpdump'

def ensure_capture_dir():
    """Ensure the packet capture directory exists"""
    if not os.path.exists(CAPTURE_DIR):
        try:
            os.makedirs(CAPTURE_DIR)
            return True
        except Exception as e:
            print(f"Error creating capture directory: {e}")
            return False
    return True

def is_tcpdump_installed():
    """Check if tcpdump is installed"""
    return os.path.exists(TCPDUMP_PATH) or subprocess.run(['which', 'tcpdump'], capture_output=True).returncode == 0

def start_capture(interfaces):
    """
    Start packet capture on specified interfaces
    
    Args:
        interfaces (list): List of network interfaces to capture packets from
        
    Returns:
        tuple: (success (bool), message (str))
    """
    # Check if tcpdump is installed
    if not is_tcpdump_installed():
        return False, "Error: tcpdump is not installed. Please install it first: sudo apt-get install tcpdump"
    
    # Ensure capture directory exists
    if not ensure_capture_dir():
        return False, "Error: Failed to create capture directory"
    
    # Don't stop existing captures, only start new ones for interfaces that aren't already capturing
    active_interfaces = get_active_interfaces()
    interfaces_to_start = [iface for iface in interfaces if iface not in active_interfaces]
    
    if not interfaces_to_start:
        return True, "All requested interfaces are already being captured"
    
    # Start a new capture for each new interface
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    pids = []
    
    # Read existing PIDs if there are any
    if os.path.exists(CAPTURE_PID_FILE):
        try:
            with open(CAPTURE_PID_FILE, 'r') as f:
                existing_pids = f.read().strip().split('\n')
                pids.extend([pid for pid in existing_pids if pid])
        except:
            pass
    
    for interface in interfaces_to_start:
        # Create a unique filename for this interface
        filename = f"{CAPTURE_DIR}/capture_{interface}_{timestamp}.pcap"
        
        try:
            # Launch tcpdump with sudo to ensure it has permission to capture packets
            # -i: interface
            # -w: write to file
            # -n: don't resolve hostnames
            # -s 0: capture entire packet
            cmd = [
                'sudo', 'tcpdump', '-i', interface, '-w', filename, 
                '-n', '-s', '0', 'not port 22'  # Exclude SSH traffic
            ]
            
            # Start tcpdump process
            process = subprocess.Popen(
                cmd, 
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                start_new_session=True  # Start in a new session so it's not killed when webserver process ends
            )
            
            pids.append(str(process.pid))
            
        except Exception as e:
            return False, f"Error starting capture on {interface}: {str(e)}"
    
    # Save PIDs to file
    if pids:
        with open(CAPTURE_PID_FILE, 'w') as f:
            f.write('\n'.join(pids))
        
        return True, f"Packet capture started on interfaces: {', '.join(interfaces_to_start)}"
    else:
        return False, "Failed to start any captures"

def stop_capture(interfaces=None):
    """
    Stop packet captures
    
    Args:
        interfaces (list, optional): List of interfaces to stop capturing. If None, stop all captures.
    
    Returns:
        tuple: (success (bool), message (str))
    """
    if not os.path.exists(CAPTURE_PID_FILE):
        return True, "No captures running"
    
    try:
        with open(CAPTURE_PID_FILE, 'r') as f:
            pids = f.read().strip().split('\n')
        
        # Find the actual tcpdump processes, as our PID file contains the parent process IDs
        tcpdump_pids = []
        for pid in pids:
            if pid:
                try:
                    # Use ps to find the actual tcpdump process spawned by sudo
                    cmd = ["ps", "--ppid", pid, "-o", "pid="]
                    result = subprocess.run(cmd, capture_output=True, text=True)
                    child_pids = result.stdout.strip().split('\n')
                    for child_pid in child_pids:
                        if child_pid.strip():
                            tcpdump_pids.append(child_pid.strip())
                except Exception as e:
                    print(f"Error finding child processes for PID {pid}: {e}")
        
        # If stopping all interfaces
        if interfaces is None:
            # Kill the main processes (our sudo wrappers)
            for pid in pids:
                if pid:
                    try:
                        os.kill(int(pid), signal.SIGTERM)
                    except ProcessLookupError:
                        # Process already gone
                        pass
                    except Exception as e:
                        print(f"Error stopping process {pid}: {e}")
            
            # Also try to kill the tcpdump processes directly
            for pid in tcpdump_pids:
                try:
                    subprocess.run(["sudo", "kill", pid])
                except Exception as e:
                    print(f"Error killing tcpdump process {pid}: {e}")
            
            # Remove PID file
            os.remove(CAPTURE_PID_FILE)
            return True, "All packet captures stopped"
        
        # If stopping specific interfaces, we need to identify which PIDs to kill
        # This is challenging since we don't directly track which PID is for which interface
        # As a workaround, we'll just stop all captures and restart the ones we want to keep
        active_interfaces = get_active_interfaces()
        interfaces_to_keep = [iface for iface in active_interfaces if iface not in interfaces]
        
        # Stop all captures first
        for pid in pids:
            if pid:
                try:
                    os.kill(int(pid), signal.SIGTERM)
                except ProcessLookupError:
                    # Process already gone
                    pass
                except Exception as e:
                    print(f"Error stopping process {pid}: {e}")
        
        # Also try to kill the tcpdump processes directly
        for pid in tcpdump_pids:
            try:
                subprocess.run(["sudo", "kill", pid])
            except Exception as e:
                print(f"Error killing tcpdump process {pid}: {e}")
        
        # Remove PID file
        os.remove(CAPTURE_PID_FILE)
        
        # Restart captures for interfaces to keep
        if interfaces_to_keep:
            success, msg = start_capture(interfaces_to_keep)
            if success:
                return True, f"Stopped capture on interfaces: {', '.join(interfaces)}"
            else:
                return False, f"Stopped all captures but failed to restart: {msg}"
        
        return True, f"Stopped capture on interfaces: {', '.join(interfaces)}"
    
    except Exception as e:
        return False, f"Error stopping capture: {str(e)}"

def get_capture_status():
    """
    Get the status of packet captures
    
    Returns:
        tuple: (is_running (bool), status_info (str))
    """
    if not os.path.exists(CAPTURE_PID_FILE):
        return False, "No captures running"
    
    try:
        with open(CAPTURE_PID_FILE, 'r') as f:
            pids = f.read().strip().split('\n')
        
        active_pids = []
        for pid in pids:
            if pid and os.path.exists(f"/proc/{pid}"):
                active_pids.append(pid)
        
        if active_pids:
            # Get capture file sizes
            capture_info = []
            for file in os.listdir(CAPTURE_DIR):
                if file.startswith("capture_") and file.endswith(".pcap"):
                    file_path = os.path.join(CAPTURE_DIR, file)
                    size_mb = os.path.getsize(file_path) / (1024 * 1024)
                    interface = file.split('_')[1]
                    timestamp = file.split('_')[2] + "_" + file.split('_')[3].split('.')[0]
                    capture_info.append(f"Capture on {interface}: {size_mb:.2f} MB (started at {timestamp})")
            
            return True, "Capture running. PIDs: " + ", ".join(active_pids) + "\n" + "\n".join(capture_info)
        else:
            # No active processes, clean up PID file
            os.remove(CAPTURE_PID_FILE)
            return False, "No captures running"
    
    except Exception as e:
        return False, f"Error checking capture status: {str(e)}"

def get_capture_files():
    """
    Get a list of capture files
    
    Returns:
        list: List of dictionaries with capture file information
    """
    if not os.path.exists(CAPTURE_DIR):
        return []
    
    capture_files = []
    for file in os.listdir(CAPTURE_DIR):
        if file.startswith("capture_") and file.endswith(".pcap"):
            file_path = os.path.join(CAPTURE_DIR, file)
            size_bytes = os.path.getsize(file_path)
            mtime = os.path.getmtime(file_path)
            
            # Extract interface and timestamp from filename
            parts = file.split('_')
            if len(parts) >= 4:
                interface = parts[1]
                timestamp_str = parts[2] + "_" + parts[3].split('.')[0]
                
                capture_files.append({
                    'filename': file,
                    'path': file_path,
                    'interface': interface,
                    'timestamp': timestamp_str,
                    'size_bytes': size_bytes,
                    'size_pretty': format_size(size_bytes),
                    'mtime': mtime,
                    'mtime_pretty': datetime.datetime.fromtimestamp(mtime).strftime("%Y-%m-%d %H:%M:%S")
                })
    
    # Sort by modification time, newest first
    capture_files.sort(key=lambda x: x['mtime'], reverse=True)
    return capture_files

def format_size(size_bytes):
    """Format bytes to human-readable size"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024 or unit == 'GB':
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024 

def get_active_interfaces():
    """
    Get list of interfaces with active captures
    
    Returns:
        list: List of interface names with active captures
    """
    # First check if any tcpdump processes are running
    active_interfaces = []
    
    try:
        # Look for any active tcpdump processes run with sudo
        cmd = ["sudo", "ps", "-ef"]
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        # Parse the output to find tcpdump commands and extract interface names
        for line in result.stdout.splitlines():
            if 'tcpdump' in line and '-i' in line:
                parts = line.split()
                for i, part in enumerate(parts):
                    if part == '-i' and i+1 < len(parts):
                        interface = parts[i+1]
                        if interface not in active_interfaces and interface != 'any':
                            active_interfaces.append(interface)
        
        # If we found active interfaces, return them
        if active_interfaces:
            return active_interfaces
    except Exception as e:
        print(f"Error checking for active tcpdump processes: {e}")
    
    # Fallback to checking PID file and process existence
    if not os.path.exists(CAPTURE_PID_FILE):
        return []
    
    # Check if tcpdump processes are actually running
    active_pids = []
    try:
        with open(CAPTURE_PID_FILE, 'r') as f:
            pids = f.read().strip().split('\n')
            for pid in pids:
                if pid and os.path.exists(f"/proc/{pid}"):
                    active_pids.append(pid)
    except:
        return []
    
    # If no active processes, return empty list
    if not active_pids:
        return []
    
    # Get the active interfaces by checking tcpdump process command lines
    for pid in active_pids:
        try:
            # Try to find child processes (actual tcpdump processes)
            cmd = ["ps", "--ppid", pid, "-o", "cmd="]
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            # Parse the command line to find the interface
            for line in result.stdout.splitlines():
                if 'tcpdump' in line and '-i' in line:
                    parts = line.split()
                    for i, part in enumerate(parts):
                        if part == '-i' and i+1 < len(parts):
                            interface = parts[i+1]
                            if interface not in active_interfaces and interface != 'any':
                                active_interfaces.append(interface)
        except:
            continue
    
    # Fallback to checking capture files if cmdline method didn't work
    if not active_interfaces:
        capture_files = get_capture_files()
        if capture_files:
            # Group by interface name
            interfaces = set()
            for file in capture_files:
                interfaces.add(file['interface'])
            
            # Check if each interface is active
            for interface in interfaces:
                # Find the most recent file for this interface
                newest_file = None
                for file in capture_files:
                    if file['interface'] == interface:
                        if newest_file is None or file['mtime'] > newest_file['mtime']:
                            newest_file = file
                
                # If we found a file and it's recent (within the last 5 minutes), consider it active
                if newest_file and (time.time() - newest_file['mtime'] < 300):
                    active_interfaces.append(interface)
    
    return active_interfaces 