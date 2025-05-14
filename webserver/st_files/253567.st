PROGRAM Tank_Auto
  VAR
    I_PbFill AT %IX100.0 : BOOL;
    I_PbDischarge AT %IX100.1 : BOOL;
    I_Level_Meter AT %IW100 : INT := 0;
    I_ModeSelector AT %IX100.2 : BOOL;
    Q_Fill_Valve AT %QW101 : INT;
    Q_Discharge_Valve AT %QW102 : INT;
    Q_Display AT %QW100 : INT;
    Q_Fill_Light AT %QX100.0 : BOOL;
    Q_Discharge_Light AT %QX100.2 : BOOL;
    LowSetpoint AT %MW1 : INT := 2;
    HighSetpoint AT %MW2 : INT := 8;
    TankLevel AT %MW0 : INT;
  END_VAR

  (* Scaling formula: (Raw - 4) / (20 - 4) * (300 - 0) + 0 *)
  TankLevel := I_Level_Meter ;

  (* Determine Auto or Manual Mode *)
  IF I_ModeSelector = FALSE THEN
      (* Manual Mode Logic *)
      IF (I_PbFill = TRUE) AND (( TankLevel < LowSetpoint) OR ( TankLevel <= HighSetpoint)) THEN
          Q_Fill_Valve := 10;  (* Fully open valve (100%) *)
          Q_Fill_Light := TRUE;
      ELSE
          Q_Fill_Valve := 0;     (* Close valve (0%) *)
          Q_Fill_Light := FALSE;
      END_IF;

      IF (I_PbDischarge = FALSE) AND ( TankLevel >= HighSetpoint) THEN
          Q_Discharge_Valve := 10;  (* Fully open discharge valve (100%) *)
          Q_Discharge_Light := TRUE;
      ELSE
          Q_Discharge_Valve := 0;     (* Close discharge valve (0%) *)
          Q_Discharge_Light := FALSE;
      END_IF;
  END_IF;

  (* Automatic Mode Logic *)
  IF I_ModeSelector = TRUE THEN
      (* Pump and Fill Valve Control Logic *)
      IF ((TankLevel < LowSetpoint) OR ((TankLevel >= LowSetpoint) AND (TankLevel < HighSetpoint))) THEN
          Q_Fill_Valve := 7;  (* Open 75% for faster filling *)
          Q_Fill_Light := TRUE;
      ELSIF TankLevel >= HighSetpoint THEN
          Q_Fill_Valve := 0;   (* Close the fill valve when full *)
          Q_Fill_Light := FALSE;
      END_IF;

      (* Discharge Valve Control Logic *)
      IF TankLevel >= HighSetpoint THEN
          Q_Discharge_Valve := 5;  (* Open discharge valve to 50% *)
          Q_Discharge_Light := TRUE;
      ELSE
          Q_Discharge_Valve := 0;   (* Close discharge valve when below threshold *)
          Q_Discharge_Light := FALSE;
      END_IF;
  END_IF;

  Q_Display := I_Level_Meter;
END_PROGRAM


CONFIGURATION Config0

  RESOURCE Res0 ON PLC
    TASK task0(INTERVAL := T#20ms,PRIORITY := 0);
    PROGRAM instance0 WITH task0 : Tank_Auto;
  END_RESOURCE
END_CONFIGURATION
