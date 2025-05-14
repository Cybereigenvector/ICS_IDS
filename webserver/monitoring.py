import time, threading
from struct import *

# Handle PyModbus import with full compatibility
ModbusTcpClient = None

# Try all possible import paths for PyModbus
try:
    # For very recent versions
    from pymodbus.client import ModbusTcpClient
except ImportError:
    try:
        # For versions 2.5.0 to 3.0.0
        from pymodbus.client.sync import ModbusTcpClient
    except ImportError:
        try:
            # For Debian package or very old versions
            from pymodbus.client.tcp import ModbusTcpClient
        except ImportError:
            # Last resort - try specific path for pymodbus 3.x
            try:
                from pymodbus.client.tcp import ModbusTcpClient as ModbusTcpClient
            except ImportError:
                print("WARNING: Could not import ModbusTcpClient. Monitoring functionality will be limited.")

class debug_var():
    name = ''
    location = ''
    type = ''
    forced = 'No'
    value = 0

debug_vars = []
monitor_active = False
mb_client = None

def parse_st(st_file):
    global debug_vars
    filepath = './st_files/' + st_file
    
    st_program = open(filepath, 'r')
    
    lines = st_program.readlines()
    in_var_external_block = False
    memory_address_counter = 0  # Counter for assigning memory addresses to external variables
    
    for i, line in enumerate(lines):
        # Check for VAR_EXTERNAL blocks
        if "VAR_EXTERNAL" in line:
            in_var_external_block = True
            continue
        elif "END_VAR" in line and in_var_external_block:
            in_var_external_block = False
            continue
            
        # Process variables with explicit AT location
        if line.find(' AT ') > 0 and line.find('%') > 0 and line.find('(*') < 0 and line.find('*)') < 0:
            debug_data = debug_var()
            tmp = line.strip().split(' ')
            debug_data.name = tmp[0]
            debug_data.location = tmp[2]
            debug_data.type = tmp[4].split(';')[0]
            
            #don't add special functions (%ML1024 and up) as they are not accessible
            if (debug_data.location.find('ML')) > 0:
                mb_address = debug_data.location.split('%ML')[1]
                if (int(mb_address) < 1024):
                    debug_vars.append(debug_data)
            else:
                debug_vars.append(debug_data)
        
        # Process VAR_EXTERNAL variables
        elif in_var_external_block and ":" in line and ";" in line and not line.strip().startswith('(*') and not line.strip().endswith('*)'):
            try:
                debug_data = debug_var()
                parts = line.strip().split(':')
                debug_data.name = parts[0].strip()
                debug_data.type = parts[1].strip().split(';')[0].strip()
                
                # Assign memory address based on variable type
                if debug_data.type in ["BOOL"]:
                    debug_data.location = f"%MX{memory_address_counter}.0"
                elif debug_data.type in ["SINT", "USINT", "BYTE", "CHAR"]:
                    debug_data.location = f"%MB{memory_address_counter}"
                elif debug_data.type in ["INT", "UINT", "WORD"]:
                    debug_data.location = f"%MW{memory_address_counter}"
                elif debug_data.type in ["DINT", "UDINT", "REAL", "DWORD"]:
                    debug_data.location = f"%MD{memory_address_counter}"
                elif debug_data.type in ["LINT", "ULINT", "LREAL", "LWORD"]:
                    debug_data.location = f"%ML{memory_address_counter}"
                else:
                    # Default to word memory for unknown types
                    debug_data.location = f"%MW{memory_address_counter}"
                
                memory_address_counter += 1
                debug_vars.append(debug_data)
            except:
                pass  # Skip if line format doesn't match expected pattern
    
    for debugs in debug_vars:
        print('Name: ' + debugs.name)
        print('Location: ' + debugs.location)
        print('Type: ' + debugs.type)
        print('')


def cleanup():
    del debug_vars[:]
    
def modbus_monitor():
    global mb_client
    for debug_data in debug_vars:
        if (debug_data.location.find('IX')) > 0:
            #Reading Input Status
            mb_address = debug_data.location.split('%IX')[1].split('.')
            result = mb_client.read_discrete_inputs(int(mb_address[0])*8 + int(mb_address[1]), 1)
            debug_data.value = result.bits[0]
            
        elif (debug_data.location.find('QX')) > 0:
            #Reading Coils
            mb_address = debug_data.location.split('%QX')[1].split('.')
            if (len(mb_address) < 2):
                result = mb_client.read_coils(int(mb_address[0])*8, 1)
            else:
                result = mb_client.read_coils(int(mb_address[0])*8 + int(mb_address[1]), 1)
            debug_data.value = result.bits[0]
            
        elif (debug_data.location.find('IW')) > 0:
            #Reading Input Registers
            mb_address = debug_data.location.split('%IW')[1]
            result = mb_client.read_input_registers(int(mb_address), 1)
            debug_data.value = result.registers[0]
            
        elif (debug_data.location.find('QW')) > 0:
            #Reading Holding Registers
            mb_address = debug_data.location.split('%QW')[1]
            result = mb_client.read_holding_registers(int(mb_address), 1)
            debug_data.value = result.registers[0]
            
        elif (debug_data.location.find('MW')) > 0:
            #Reading Word Memory
            mb_address = debug_data.location.split('%MW')[1]
            result = mb_client.read_holding_registers(int(mb_address) + 1024, 1)
            debug_data.value = result.registers[0]
            
        elif (debug_data.location.find('MD')) > 0:
            #Reading Double Memory
            mb_address = debug_data.location.split('%MD')[1]
            result = mb_client.read_holding_registers((int(mb_address)*2) + 2048, 2)
            if (debug_data.type == 'SINT') or (debug_data.type == 'INT') or (debug_data.type == 'DINT'):
                #signed integer
                float_pack = pack('>HH', result.registers[0], result.registers[1])
                debug_data.value = unpack('>i', float_pack)[0]
                
            if (debug_data.type == 'USINT') or (debug_data.type == 'UINT') or (debug_data.type == 'UDINT'):
                #unsigned integer
                float_pack = pack('>HH', result.registers[0], result.registers[1])
                debug_data.value = unpack('>I', float_pack)[0]
                
            if (debug_data.type == 'REAL'):
                #32-bit float
                float_pack = pack('>HH', result.registers[0], result.registers[1])
                debug_data.value = unpack('>f', float_pack)[0]
                
        elif (debug_data.location.find('ML')) > 0:
            #Reading Long Memory
            mb_address = debug_data.location.split('%ML')[1]
            result = mb_client.read_holding_registers((int(mb_address)*4) + 4096, 4)
            if (debug_data.type == 'SINT') or (debug_data.type == 'INT') or (debug_data.type == 'DINT') or (debug_data.type == 'LINT'):
                #signed integer
                float_pack = pack('>HHHH', result.registers[0], result.registers[1], result.registers[2], result.registers[3])
                debug_data.value = unpack('>q', float_pack)[0]
                
            if (debug_data.type == 'USINT') or (debug_data.type == 'UINT') or (debug_data.type == 'UDINT') or (debug_data.type == 'ULINT'):
                #unsigned integer
                float_pack = pack('>HHHH', result.registers[0], result.registers[1], result.registers[2], result.registers[3])
                debug_data.value = unpack('>Q', float_pack)[0]
                
            if (debug_data.type == 'REAL') or (debug_data.type == 'LREAL'):
                #64-bit float
                float_pack = pack('>HHHH', result.registers[0], result.registers[1], result.registers[2], result.registers[3])
                debug_data.value = unpack('>d', float_pack)[0]
            
    
    if (monitor_active == True):
        threading.Timer(0.5, modbus_monitor).start()

def write_value(point_address, point_value):
    global mb_client

    # COILS
    if (point_address.find('QX')) > 0:
        mb_address = point_address.split('%QX')[1].split('.')
        if (len(mb_address) < 2):
            result = mb_client.write_coil(int(mb_address[0])*8, int(point_value))
        else:
            result = mb_client.write_coil(int(mb_address[0])*8 + int(mb_address[1]), int(point_value))
    
def start_monitor(modbus_port_cfg):
    global monitor_active
    global mb_client
    
    if (monitor_active != True):
        monitor_active = True
        mb_client = ModbusTcpClient('127.0.0.1', port=modbus_port_cfg)
        
        modbus_monitor()

def stop_monitor():
    global monitor_active
    global mb_client
    
    if (monitor_active != False):
        monitor_active = False
        mb_client.close()