FUNCTION_BLOCK Temp_Conversion
  VAR_INPUT
    raw_temp : UINT;
  END_VAR
  VAR
    intermediate : REAL;
  END_VAR
  VAR_OUTPUT
    converted_temp : INT;
  END_VAR

  intermediate := UINT_TO_REAL(raw_temp);
  intermediate := 10000.0 / (65536.0 / intermediate - 1.0);
  intermediate := intermediate / 10000.0;
  intermediate := LN(intermediate);
  intermediate := 1.0 / ((1.0/298.15) + (intermediate * (1.0/3950.0)));
  intermediate := intermediate - 273.15;
  intermediate := intermediate * 100.0;
  converted_temp := REAL_TO_INT(intermediate);
END_FUNCTION_BLOCK

PROGRAM My_Program
  VAR
    raw_temp AT %IW0 : UINT;
    Ref_Voltage AT %QW0 : UINT := 65535;
    converted_temp AT %QW1 : INT;
    setpoint AT %QW2 : INT := 4000;
    mode_register AT %QW4 : INT;
    heater_control AT %QW5 : INT;
    heater_man AT %QX99.0 : BOOL;
    heater_auto AT %QX99.1 : BOOL;
    heater AT %QX0.0 : BOOL;
  END_VAR
  VAR
    Temp_Conversion0 : Temp_Conversion;
    SUB31_OUT : INT;
    LE9_OUT : BOOL;
    GE18_OUT : BOOL;
    EQ6_OUT : BOOL;
    EQ2_OUT : BOOL;
    EQ26_OUT : BOOL;
  END_VAR

  Temp_Conversion0(raw_temp := raw_temp);
  converted_temp := Temp_Conversion0.converted_temp;
  SUB31_OUT := SUB(setpoint, 150);
  LE9_OUT := LE(converted_temp, SUB31_OUT);
  IF LE9_OUT THEN
    heater_auto := TRUE; (*set*)
  END_IF;
  GE18_OUT := GE(converted_temp, setpoint);
  IF GE18_OUT THEN
    heater_auto := FALSE; (*reset*)
  END_IF;
  EQ6_OUT := EQ(heater_control, 1);
  heater_man := EQ6_OUT;
  EQ2_OUT := EQ(mode_register, 0);
  EQ26_OUT := EQ(mode_register, 1);
  heater := heater_auto AND EQ2_OUT OR heater_man AND EQ26_OUT;
END_PROGRAM


CONFIGURATION Config0

  RESOURCE Res0 ON PLC
    TASK TaskMain(INTERVAL := T#50ms,PRIORITY := 0);
    PROGRAM Inst0 WITH TaskMain : My_Program;
  END_RESOURCE
END_CONFIGURATION
