PROGRAM Base_Production
  VAR
    BasesEntry AT %IX101.0 : BOOL;
    BasesExit AT %IX101.1 : BOOL;
  END_VAR
  VAR_EXTERNAL
    BasesCenterBusy : BOOL;
    LidsCenterBusy : BOOL;
  END_VAR
  VAR
    BasesCenterError AT %IX101.3 : BOOL;
    BasesCenterStop AT %QX101.0 : BOOL;
    BasesCenterStart AT %QX101.1 : BOOL;
    BasesCenterReset AT %QX101.2 : BOOL;
    BasesRawConveyor AT %QX101.3 : BOOL;
    BasesExitConveyor AT %QX101.4 : BOOL;
    BasesEmitter AT %QX101.5 : BOOL;
    BeltConv5 AT %QX101.6 : BOOL;
    BeltConv6 AT %QX101.7 : BOOL;
    ExitConv AT %QX102.7 : BOOL;
  END_VAR
  VAR_EXTERNAL
    FactoryIORunning : BOOL;
  END_VAR
  VAR
    R_TRIG0 : R_TRIG;
    RS0 : RS;
  END_VAR
  VAR
    BasesExitCounter AT %QW101 : INT;
  END_VAR
  VAR
    CTU0 : CTU;
  END_VAR
  VAR_EXTERNAL
    SCADASetProductCount : INT;
    AssembledProductCount : INT;
  END_VAR
  VAR_OUTPUT
    StopBaseProduction : BOOL;
  END_VAR
  VAR_EXTERNAL
    EStopGlobal : BOOL;
  END_VAR
  VAR
    R_TRIG1 : R_TRIG;
    LT37_OUT : BOOL;
  END_VAR

  BasesEmitter := StopBaseProduction AND FactoryIORunning AND NOT(EStopGlobal);
  BasesExitConveyor := FactoryIORunning AND NOT(EStopGlobal);
  BasesCenterStart := BasesEntry;
  R_TRIG0(CLK := BasesCenterError);
  BasesCenterStop := EStopGlobal OR R_TRIG0.Q;
  RS0(S := NOT(LidsCenterBusy) AND NOT(BasesCenterBusy) AND NOT(BasesCenterError) AND FactoryIORunning AND NOT(EStopGlobal), R1 := BasesCenterBusy OR BasesCenterError OR EStopGlobal);
  BasesRawConveyor := RS0.Q1;
  BeltConv5 := FactoryIORunning AND NOT(EStopGlobal);
  BeltConv6 := FactoryIORunning AND NOT(EStopGlobal);
  ExitConv := FactoryIORunning AND NOT(EStopGlobal);
  R_TRIG1(CLK := BasesExit);
  CTU0(CU := R_TRIG1.Q, R := NOT(FactoryIORunning), PV := 100);
  BasesExitCounter := CTU0.CV;
  LT37_OUT := LT(BasesExitCounter, SCADASetProductCount);
  StopBaseProduction := LT37_OUT;
END_PROGRAM

PROGRAM Assembly
  VAR_EXTERNAL
    FactoryIORunning : BOOL;
    AssemblyEstop2 : BOOL;
    EStopGlobal : BOOL;
    AssemblyStartPB3 : BOOL;
    AssemblyResetPB2 : BOOL;
  END_VAR
  VAR
    SCADAStopLocal : BOOL;
    SCADAResetLocal : BOOL;
  END_VAR
  VAR_EXTERNAL
    SCADAEStop : INT;
    SCADAEStopReset : INT;
  END_VAR
  VAR
    Conv6m_1_LIDFeeder AT %QX102.0 : BOOL;
    Conv6m_4_BASEFeeder0 AT %QX102.1 : BOOL;
    DiffuseSensor1 AT %IX102.0 : BOOL;
    DiffuseSensor3 AT %IX102.1 : BOOL;
    LeftClampSensor AT %IX102.2 : BOOL;
    RightClampSensor AT %IX102.3 : BOOL;
    LeftClampOut AT %QX102.2 : BOOL;
    RightClampOut AT %QX102.3 : BOOL;
    Z_AxisDownOut AT %QX102.4 : BOOL;
    X_AxisMoveOut AT %QX102.5 : BOOL;
    Z_AxisDownSensor AT %IX102.4 : BOOL;
    X_AxisMoveSensor AT %IX102.5 : BOOL;
    GripperONOut AT %QX102.6 : BOOL;
    Conv4m_5_AfterRaise AT %QX103.0 : BOOL;
    LeftPos2_Raise AT %QX103.1 : BOOL;
    GripperONSensor AT %IX102.6 : BOOL;
    DiffuseSensor2 AT %IX102.7 : BOOL;
  END_VAR
  VAR
    BeginAssembly : BOOL;
    StopBaseFeederConv : BOOL;
  END_VAR
  VAR
    DiffuseSensor7 AT %IX104.1 : BOOL;
    VisionSensor AT %IW100 : WORD;
    PivotBeltRun AT %QX104.3 : BOOL;
    PivotBeltTurn AT %QX104.4 : BOOL;
    RejectionAlarm AT %QX104.5 : BOOL;
    RejectionSiren AT %QX104.6 : BOOL;
  END_VAR
  VAR
    VisionTestFail1 : BOOL;
    VisionTestFail2 : BOOL;
    VisionTestFail : BOOL;
    RunRejectionPivot : BOOL;
    TON0 : TON;
  END_VAR
  VAR
    BeltConv6m_5 AT %QX106.3 : BOOL;
    BeltConv6m_6 AT %QX106.4 : BOOL;
    BeltConv6m_7 AT %QX106.5 : BOOL;
    BeltConv6m_8 AT %QX106.6 : BOOL;
    CurveBeltConv1_CCW AT %QX106.7 : BOOL;
    AssemblyRedLight AT %QX107.0 : BOOL;
  END_VAR
  VAR_EXTERNAL
    AssembledProductCount : INT;
    QCStationEnable : INT;
  END_VAR
  VAR
    BoolQCStationEnable AT %QX107.4 : BOOL;
    RejectedProductCount AT %QW103 : INT;
  END_VAR
  VAR
    CTU0 : CTU;
    CTU1 : CTU;
    F_TRIG1 : F_TRIG;
    F_TRIG2 : F_TRIG;
    F_TRIG3 : F_TRIG;
    F_TRIG4 : F_TRIG;
    F_TRIG5 : F_TRIG;
    F_TRIG6 : F_TRIG;
    F_TRIG7 : F_TRIG;
    F_TRIG8 : F_TRIG;
    F_TRIG9 : F_TRIG;
    F_TRIG10 : F_TRIG;
    F_TRIG11 : F_TRIG;
    F_TRIG12 : F_TRIG;
    F_TRIG13 : F_TRIG;
    F_TRIG14 : F_TRIG;
    F_TRIG15 : F_TRIG;
    F_TRIG16 : F_TRIG;
    R_TRIG1 : R_TRIG;
    R_TRIG2 : R_TRIG;
    NE114_OUT : BOOL;
    NE115_OUT : BOOL;
    R_TRIG3 : R_TRIG;
    R_TRIG4 : R_TRIG;
    EQ203_OUT : BOOL;
    EQ204_OUT : BOOL;
    EQ217_OUT : BOOL;
  END_VAR

  Conv6m_1_LIDFeeder := FactoryIORunning AND NOT(EStopGlobal);
  Conv6m_4_BASEFeeder0 := NOT(StopBaseFeederConv) AND FactoryIORunning AND NOT(EStopGlobal);
  Conv4m_5_AfterRaise := FactoryIORunning AND NOT(EStopGlobal);
  F_TRIG1(CLK := DiffuseSensor1);
  IF F_TRIG1.Q AND FactoryIORunning THEN
    LeftClampOut := TRUE; (*set*)
  END_IF;
  F_TRIG2(CLK := DiffuseSensor3);
  IF F_TRIG2.Q AND FactoryIORunning THEN
    RightClampOut := TRUE; (*set*)
  END_IF;
  IF NOT(BeginAssembly) AND RightClampOut AND LeftClampOut THEN
    Z_AxisDownOut := TRUE; (*set*)
  END_IF;
  F_TRIG3(CLK := Z_AxisDownSensor);
  IF F_TRIG3.Q AND RightClampOut AND LeftClampOut THEN
    BeginAssembly := TRUE; (*set*)
  END_IF;
  F_TRIG4(CLK := Z_AxisDownSensor);
  IF F_TRIG4.Q AND RightClampOut AND LeftClampOut THEN
    GripperONOut := TRUE; (*set*)
  END_IF;
  IF GripperONSensor AND GripperONOut AND RightClampOut AND LeftClampOut THEN
    Z_AxisDownOut := FALSE; (*reset*)
  END_IF;
  IF GripperONSensor AND GripperONOut AND RightClampOut AND LeftClampOut THEN
    RightClampOut := FALSE; (*reset*)
  END_IF;
  IF GripperONSensor AND GripperONOut AND NOT(RightClampOut) AND LeftClampOut THEN
    X_AxisMoveOut := TRUE; (*set*)
  END_IF;
  F_TRIG5(CLK := X_AxisMoveSensor);
  IF F_TRIG5.Q AND X_AxisMoveOut AND GripperONSensor AND GripperONOut AND NOT(RightClampOut) AND LeftClampOut THEN
    Z_AxisDownOut := TRUE; (*set*)
  END_IF;
  F_TRIG6(CLK := Z_AxisDownSensor);
  IF F_TRIG6.Q AND Z_AxisDownOut AND X_AxisMoveOut AND NOT(RightClampOut) AND LeftClampOut THEN
    GripperONOut := FALSE; (*reset*)
  END_IF;
  F_TRIG7(CLK := Z_AxisDownSensor);
  IF F_TRIG7.Q AND Z_AxisDownOut AND X_AxisMoveOut AND NOT(RightClampOut) AND LeftClampOut THEN
    Z_AxisDownOut := FALSE; (*reset*)
  END_IF;
  F_TRIG8(CLK := Z_AxisDownSensor);
  IF F_TRIG8.Q AND Z_AxisDownOut AND X_AxisMoveOut AND NOT(RightClampOut) AND LeftClampOut THEN
    X_AxisMoveOut := FALSE; (*reset*)
  END_IF;
  F_TRIG9(CLK := Z_AxisDownSensor);
  IF NOT(GripperONOut) AND F_TRIG9.Q AND NOT(Z_AxisDownOut) AND X_AxisMoveOut AND NOT(RightClampOut) AND LeftClampOut THEN
    LeftPos2_Raise := TRUE; (*set*)
  END_IF;
  F_TRIG10(CLK := DiffuseSensor2);
  IF F_TRIG10.Q AND LeftPos2_Raise THEN
    Z_AxisDownOut := FALSE; (*reset*)
  END_IF;
  F_TRIG11(CLK := DiffuseSensor2);
  IF F_TRIG11.Q AND LeftPos2_Raise THEN
    X_AxisMoveOut := FALSE; (*reset*)
  END_IF;
  F_TRIG12(CLK := DiffuseSensor2);
  IF F_TRIG12.Q AND LeftPos2_Raise THEN
    RightClampOut := FALSE; (*reset*)
  END_IF;
  F_TRIG13(CLK := DiffuseSensor2);
  IF F_TRIG13.Q AND LeftPos2_Raise THEN
    GripperONOut := FALSE; (*reset*)
  END_IF;
  F_TRIG14(CLK := DiffuseSensor2);
  IF F_TRIG14.Q AND LeftPos2_Raise THEN
    LeftClampOut := FALSE; (*reset*)
  END_IF;
  F_TRIG15(CLK := DiffuseSensor2);
  IF F_TRIG15.Q AND LeftPos2_Raise THEN
    BeginAssembly := FALSE; (*reset*)
  END_IF;
  F_TRIG16(CLK := DiffuseSensor2);
  IF F_TRIG16.Q AND LeftPos2_Raise THEN
    LeftPos2_Raise := FALSE; (*reset*)
  END_IF;
  R_TRIG1(CLK := BeginAssembly);
  IF R_TRIG1.Q THEN
    StopBaseFeederConv := TRUE; (*set*)
  END_IF;
  R_TRIG2(CLK := LeftPos2_Raise);
  IF R_TRIG2.Q THEN
    StopBaseFeederConv := FALSE; (*reset*)
  END_IF;
  NE114_OUT := NE(VisionSensor, 0);
  VisionTestFail1 := NE114_OUT;
  NE115_OUT := NE(VisionSensor, 2);
  VisionTestFail2 := NE115_OUT;
  VisionTestFail := BoolQCStationEnable AND VisionTestFail2 AND VisionTestFail1;
  RunRejectionPivot := NOT(TON0.Q) AND NOT(DiffuseSensor7) AND (RunRejectionPivot OR VisionTestFail);
  PivotBeltRun := RunRejectionPivot;
  PivotBeltTurn := RunRejectionPivot;
  RejectionAlarm := RunRejectionPivot;
  RejectionSiren := RunRejectionPivot;
  BeltConv6m_5 := FactoryIORunning;
  BeltConv6m_6 := FactoryIORunning;
  BeltConv6m_7 := FactoryIORunning;
  BeltConv6m_8 := FactoryIORunning;
  CurveBeltConv1_CCW := FactoryIORunning;
  IF NOT(FactoryIORunning) THEN
    Z_AxisDownOut := FALSE; (*reset*)
  END_IF;
  IF NOT(FactoryIORunning) THEN
    X_AxisMoveOut := FALSE; (*reset*)
  END_IF;
  IF NOT(FactoryIORunning) THEN
    RightClampOut := FALSE; (*reset*)
  END_IF;
  IF NOT(FactoryIORunning) THEN
    GripperONOut := FALSE; (*reset*)
  END_IF;
  IF NOT(FactoryIORunning) THEN
    LeftClampOut := FALSE; (*reset*)
  END_IF;
  IF NOT(FactoryIORunning) THEN
    BeginAssembly := FALSE; (*reset*)
  END_IF;
  IF NOT(FactoryIORunning) THEN
    LeftPos2_Raise := FALSE; (*reset*)
  END_IF;
  IF NOT(FactoryIORunning) THEN
    StopBaseFeederConv := FALSE; (*reset*)
  END_IF;
  R_TRIG3(CLK := LeftPos2_Raise);
  CTU1(CU := R_TRIG3.Q, R := NOT(FactoryIORunning), PV := 100);
  AssembledProductCount := CTU1.CV;
  R_TRIG4(CLK := RunRejectionPivot);
  CTU0(CU := R_TRIG4.Q, R := NOT(FactoryIORunning), PV := 100);
  RejectedProductCount := CTU0.CV;
  EStopGlobal := NOT(SCADAResetLocal) AND (NOT(AssemblyResetPB2) AND (EStopGlobal AND FactoryIORunning OR NOT(AssemblyEstop2) AND FactoryIORunning) OR SCADAStopLocal AND FactoryIORunning);
  AssemblyRedLight := EStopGlobal;
  EQ203_OUT := EQ(SCADAEStop, 9);
  SCADAStopLocal := EQ203_OUT;
  EQ204_OUT := EQ(SCADAEStopReset, 1);
  SCADAResetLocal := EQ204_OUT;
  EQ217_OUT := EQ(QCStationEnable, 1);
  BoolQCStationEnable := EQ217_OUT;
  TON0(IN := RunRejectionPivot, PT := t#5s);
END_PROGRAM

PROGRAM Warehouse
  VAR
    RollerConv2M_1 AT %QX104.7 : BOOL;
    RollerConv2M_2 AT %QX105.0 : BOOL;
    RollerConv2M_3 AT %QX105.1 : BOOL;
    RollerConv2M_4 AT %QX105.2 : BOOL;
    RollerConv2M_5 AT %QX105.3 : BOOL;
    CurveRoller2_CW AT %QX105.4 : BOOL;
    CurveRoller1_CCW AT %QX105.5 : BOOL;
    LoadConv1 AT %QX105.6 : BOOL;
    LoadConv2 AT %QX105.7 : BOOL;
    StackCrane1_Left AT %QX106.0 : BOOL;
    StackCrane1_Right AT %QX106.1 : BOOL;
    StackCrane1_LIFT AT %QX106.2 : BOOL;
    StackCrane1_TargetPos AT %QW105 : INT;
    StackCrane1_MovX AT %IX104.2 : BOOL;
    StackCrane1_MovZ AT %IX104.3 : BOOL;
    StackCrane1_LeftLimit AT %IX104.4 : BOOL;
    StackCrane1_RightLimit0 AT %IX104.5 : BOOL;
    StackCrane1_MiddleLimit AT %IX104.6 : BOOL;
    ReflectiveSensor_5 AT %IX104.7 : BOOL;
    ReflectiveSensor_6 AT %IX105.0 : BOOL;
    ReflectiveSensor_7 AT %IX105.1 : BOOL;
    ReflectiveSensor_8 AT %IX105.2 : BOOL;
  END_VAR
  VAR_EXTERNAL
    FactoryIORunning : BOOL;
  END_VAR
  VAR
    StartLoading : BOOL;
    StartStacking : BOOL;
    StartStacking2 : BOOL;
    StartStacking3 : BOOL;
    StartStacking4 : BOOL;
    StartStacking5 : BOOL;
    StartStacking6 : BOOL;
    StartStacking7 : BOOL;
    StartStacking8 : BOOL;
    FactoryIOStop : BOOL;
  END_VAR
  VAR
    SafetyDoorSensor AT %IX105.6 : BOOL;
    SafetyDoorReset AT %IX105.7 : BOOL;
    SafetyDoorLight AT %QX107.2 : BOOL;
    SafetyDoorSiren AT %QX107.3 : BOOL;
  END_VAR
  VAR
    TargetPositionVar : INT;
    CTU0 : CTU;
    F_TRIG1 : F_TRIG;
    F_TRIG2 : F_TRIG;
    F_TRIG3 : F_TRIG;
    R_TRIG1 : R_TRIG;
    SEL60_OUT : INT;
    R_TRIG2 : R_TRIG;
    F_TRIG4 : F_TRIG;
    F_TRIG5 : F_TRIG;
    R_TRIG3 : R_TRIG;
    F_TRIG6 : F_TRIG;
    R_TRIG4 : R_TRIG;
    MOVE109_ENO : BOOL;
    MOVE109_OUT : INT;
  END_VAR

  RollerConv2M_3 := FactoryIORunning;
  RollerConv2M_4 := FactoryIORunning;
  RollerConv2M_5 := FactoryIORunning;
  CurveRoller2_CW := FactoryIORunning;
  CurveRoller1_CCW := FactoryIORunning;
  F_TRIG1(CLK := ReflectiveSensor_5);
  StartLoading := ReflectiveSensor_6 AND (F_TRIG1.Q OR StartLoading) AND FactoryIORunning;
  RollerConv2M_1 := StartLoading;
  LoadConv2 := StartLoading;
  F_TRIG2(CLK := ReflectiveSensor_6);
  StartStacking := NOT(StartStacking8) AND (F_TRIG2.Q OR StartStacking) AND FactoryIORunning;
  StackCrane1_Left := NOT(StartStacking2) AND StartStacking;
  StackCrane1_LIFT := NOT(StartStacking6) AND (StackCrane1_LIFT OR StackCrane1_LeftLimit AND StackCrane1_Left) AND StartStacking;
  F_TRIG3(CLK := StackCrane1_MovZ);
  StartStacking2 := (F_TRIG3.Q AND StackCrane1_LIFT OR StartStacking2) AND StartStacking;
  R_TRIG1(CLK := StackCrane1_MiddleLimit);
  StartStacking3 := (R_TRIG1.Q OR StartStacking3) AND StartStacking2;
  SEL60_OUT := SEL(StartStacking3, 55, TargetPositionVar);
  StackCrane1_TargetPos := SEL60_OUT;
  R_TRIG2(CLK := StartStacking);
  CTU0(EN := FactoryIORunning, CU := R_TRIG2.Q, R := FactoryIOStop, PV := 54);
  IF CTU0.ENO THEN
      TargetPositionVar := CTU0.CV;
  END_IF;
  F_TRIG4(CLK := StackCrane1_MovX);
  StartStacking4 := (F_TRIG4.Q OR StartStacking4) AND StartStacking3;
  F_TRIG5(CLK := StackCrane1_MovZ);
  StartStacking5 := (F_TRIG5.Q OR StartStacking5) AND StartStacking3;
  StackCrane1_Right := NOT(StartStacking7) AND StartStacking5 AND StartStacking4;
  R_TRIG3(CLK := StackCrane1_RightLimit0);
  StartStacking6 := (R_TRIG3.Q OR StartStacking6) AND StartStacking5 AND StartStacking4;
  F_TRIG6(CLK := StackCrane1_MovZ);
  StartStacking7 := (F_TRIG6.Q OR StartStacking7) AND StartStacking6;
  R_TRIG4(CLK := StackCrane1_MiddleLimit);
  StartStacking8 := (R_TRIG4.Q OR StartStacking8) AND StartStacking7;
  MOVE109_OUT := MOVE(EN := NOT(FactoryIORunning), IN := 0, ENO => MOVE109_ENO);
  IF MOVE109_ENO THEN
      TargetPositionVar := MOVE109_OUT;
  END_IF;
  FactoryIOStop := NOT(FactoryIORunning);
  SafetyDoorSiren := NOT(SafetyDoorReset) AND (NOT(SafetyDoorSensor) OR SafetyDoorSiren) AND FactoryIORunning;
  SafetyDoorLight := NOT(SafetyDoorReset) AND (NOT(SafetyDoorSensor) OR SafetyDoorSiren) AND FactoryIORunning;
END_PROGRAM

PROGRAM Lids_Production
  VAR
    LidsEntry AT %IX100.0 : BOOL;
    LidsExit AT %IX100.1 : BOOL;
  END_VAR
  VAR_EXTERNAL
    LidsCenterBusy : BOOL;
    BasesCenterBusy : BOOL;
  END_VAR
  VAR
    LidsCenterError AT %IX100.3 : BOOL;
    LidsCenterStop AT %QX100.0 : BOOL;
    LidsCenterStart AT %QX100.1 : BOOL;
    LidsCenterProduce AT %QX100.2 : BOOL;
    LidsRawConveyor AT %QX100.3 : BOOL;
    LidsExitConveyor AT %QX100.4 : BOOL;
    LidsExitConveyor2 AT %QX100.7 : BOOL;
    LidsEmitter AT %QX100.5 : BOOL;
  END_VAR
  VAR_EXTERNAL
    FactoryIORun : BOOL;
    FactoryIORunning : BOOL;
  END_VAR
  VAR
    R_TRIG0 : R_TRIG;
    RS0 : RS;
    CTU0 : CTU;
  END_VAR
  VAR
    LidsExitCounter AT %QW100 : INT;
    StartButton2 AT %IX100.5 : BOOL;
  END_VAR
  VAR_EXTERNAL
    SCADASetProductCount : INT;
    AssembledProductCount : INT;
    SCADAFactoryIOStart : INT;
  END_VAR
  VAR_OUTPUT
    StopLIDProduction : BOOL;
  END_VAR
  VAR_EXTERNAL
    EStopGlobal : BOOL;
  END_VAR
  VAR
    R_TRIG1 : R_TRIG;
    LT37_OUT : BOOL;
    EQ43_OUT : BOOL;
  END_VAR

  LidsEmitter := StopLIDProduction AND FactoryIORunning AND NOT(EStopGlobal);
  LidsExitConveyor := FactoryIORunning AND NOT(EStopGlobal);
  IF FactoryIORunning AND NOT(EStopGlobal) THEN
    LidsCenterProduce := TRUE; (*set*)
  END_IF;
  LidsCenterStart := LidsEntry;
  R_TRIG0(CLK := LidsCenterError);
  LidsCenterStop := EStopGlobal OR R_TRIG0.Q;
  RS0(S := NOT(BasesCenterBusy) AND NOT(LidsCenterBusy) AND NOT(LidsCenterError) AND FactoryIORunning AND NOT(EStopGlobal), R1 := EStopGlobal OR LidsCenterBusy OR LidsCenterError);
  LidsRawConveyor := RS0.Q1;
  LidsExitConveyor2 := FactoryIORunning AND NOT(EStopGlobal);
  IF NOT(FactoryIORunning) THEN
    LidsCenterProduce := FALSE; (*reset*)
  END_IF;
  R_TRIG1(CLK := LidsExit);
  CTU0(CU := R_TRIG1.Q, R := NOT(FactoryIORunning), PV := 100);
  LidsExitCounter := CTU0.CV;
  LT37_OUT := LT(LidsExitCounter, SCADASetProductCount);
  StopLIDProduction := LT37_OUT;
  EQ43_OUT := EQ(SCADAFactoryIOStart, 1);
  FactoryIORun := EQ43_OUT;
END_PROGRAM

PROGRAM Palletizer
  VAR_EXTERNAL
    FactoryIORunning : BOOL;
  END_VAR
  VAR
    Conv6m_2_StackFeeder AT %QX103.2 : BOOL;
    Conv6m_3_AfterStack AT %QX103.3 : BOOL;
    DiffuseSensor5 AT %IX103.0 : BOOL;
    DiffuseSensor4 AT %IX103.1 : BOOL;
    LeftClampSensor AT %IX103.2 : BOOL;
    RightClampSensor AT %IX103.3 : BOOL;
    LeftClampOut AT %QX103.4 : BOOL;
    RightClampOut AT %QX103.5 : BOOL;
    Z_Axis2DownOut AT %QX103.6 : BOOL;
    X_Axis2MoveOut AT %QX103.7 : BOOL;
    Z_Axis2DownSensor AT %IX103.4 : BOOL;
    X_Axis2MoveSensor AT %IX103.5 : BOOL;
    Gripper2ONOut AT %QX104.0 : BOOL;
    LeftPos4_Raise AT %QX104.1 : BOOL;
    StackEmitter AT %QX104.2 : BOOL;
    Gripper2ONSensor AT %IX103.6 : BOOL;
    DiffuseSensor6 AT %IX103.7 : BOOL;
    RightPos1ClampOff AT %IX104.0 : BOOL;
  END_VAR
  VAR
    BeginAssembly : BOOL;
    StopFeederConveyor : BOOL;
    PickupForStack : BOOL;
    CTU0 : CTU;
  END_VAR
  VAR
    CratedProductCount AT %QW104 : INT;
  END_VAR
  VAR
    F_TRIG1 : F_TRIG;
    F_TRIG2 : F_TRIG;
    F_TRIG3 : F_TRIG;
    F_TRIG4 : F_TRIG;
    F_TRIG5 : F_TRIG;
    F_TRIG6 : F_TRIG;
    F_TRIG7 : F_TRIG;
    F_TRIG8 : F_TRIG;
    F_TRIG9 : F_TRIG;
    F_TRIG10 : F_TRIG;
    F_TRIG11 : F_TRIG;
    F_TRIG12 : F_TRIG;
    F_TRIG13 : F_TRIG;
    F_TRIG14 : F_TRIG;
    F_TRIG15 : F_TRIG;
    F_TRIG16 : F_TRIG;
    F_TRIG17 : F_TRIG;
    F_TRIG18 : F_TRIG;
    F_TRIG19 : F_TRIG;
    F_TRIG20 : F_TRIG;
    F_TRIG21 : F_TRIG;
    F_TRIG22 : F_TRIG;
    R_TRIG1 : R_TRIG;
    R_TRIG2 : R_TRIG;
  END_VAR

  Conv6m_2_StackFeeder := NOT(StopFeederConveyor) AND FactoryIORunning;
  Conv6m_3_AfterStack := FactoryIORunning;
  F_TRIG1(CLK := DiffuseSensor5);
  IF F_TRIG1.Q AND FactoryIORunning THEN
    LeftClampOut := TRUE; (*set*)
  END_IF;
  F_TRIG2(CLK := DiffuseSensor4);
  IF F_TRIG2.Q AND FactoryIORunning THEN
    RightClampOut := TRUE; (*set*)
  END_IF;
  IF NOT(BeginAssembly) AND RightClampOut AND LeftClampOut THEN
    X_Axis2MoveOut := TRUE; (*set*)
  END_IF;
  F_TRIG3(CLK := X_Axis2MoveSensor);
  IF F_TRIG3.Q AND X_Axis2MoveOut AND NOT(BeginAssembly) AND RightClampOut AND LeftClampOut THEN
    Z_Axis2DownOut := TRUE; (*set*)
  END_IF;
  F_TRIG4(CLK := Z_Axis2DownSensor);
  IF F_TRIG4.Q AND Z_Axis2DownOut AND RightClampOut AND LeftClampOut THEN
    BeginAssembly := TRUE; (*set*)
  END_IF;
  F_TRIG5(CLK := Z_Axis2DownSensor);
  IF F_TRIG5.Q AND RightClampOut AND LeftClampOut THEN
    Gripper2ONOut := TRUE; (*set*)
  END_IF;
  IF Gripper2ONSensor AND Gripper2ONOut AND RightClampOut AND LeftClampOut THEN
    RightClampOut := FALSE; (*reset*)
  END_IF;
  IF Gripper2ONSensor AND NOT(RightPos1ClampOff) AND NOT(RightClampOut) AND LeftClampOut THEN
    Z_Axis2DownOut := FALSE; (*reset*)
  END_IF;
  IF Gripper2ONSensor AND NOT(RightPos1ClampOff) AND NOT(RightClampOut) AND LeftClampOut THEN
    PickupForStack := TRUE; (*set*)
  END_IF;
  F_TRIG6(CLK := Z_Axis2DownSensor);
  IF F_TRIG6.Q AND NOT(Z_Axis2DownOut) AND Gripper2ONSensor AND Gripper2ONOut AND PickupForStack AND LeftClampOut THEN
    X_Axis2MoveOut := FALSE; (*reset*)
  END_IF;
  F_TRIG7(CLK := Z_Axis2DownSensor);
  IF F_TRIG7.Q AND NOT(Z_Axis2DownOut) AND Gripper2ONSensor AND Gripper2ONOut AND PickupForStack AND LeftClampOut THEN
    PickupForStack := FALSE; (*reset*)
  END_IF;
  F_TRIG8(CLK := Z_Axis2DownSensor);
  IF F_TRIG8.Q AND NOT(Z_Axis2DownOut) AND Gripper2ONSensor AND Gripper2ONOut AND PickupForStack AND LeftClampOut THEN
    RightClampOut := FALSE; (*reset*)
  END_IF;
  F_TRIG9(CLK := X_Axis2MoveSensor);
  IF F_TRIG9.Q AND NOT(X_Axis2MoveOut) AND Gripper2ONSensor AND Gripper2ONOut AND NOT(RightClampOut) AND LeftClampOut THEN
    Z_Axis2DownOut := TRUE; (*set*)
  END_IF;
  F_TRIG10(CLK := X_Axis2MoveSensor);
  IF F_TRIG10.Q AND NOT(X_Axis2MoveOut) AND Gripper2ONSensor AND Gripper2ONOut AND NOT(RightClampOut) AND LeftClampOut THEN
    LeftClampOut := FALSE; (*reset*)
  END_IF;
  F_TRIG11(CLK := Z_Axis2DownSensor);
  IF F_TRIG11.Q AND Z_Axis2DownOut AND NOT(X_Axis2MoveOut) AND NOT(RightClampOut) AND BeginAssembly AND NOT(LeftClampOut) THEN
    Gripper2ONOut := FALSE; (*reset*)
  END_IF;
  F_TRIG12(CLK := Z_Axis2DownSensor);
  IF F_TRIG12.Q AND Z_Axis2DownOut AND NOT(X_Axis2MoveOut) AND NOT(RightClampOut) AND BeginAssembly AND NOT(LeftClampOut) THEN
    Z_Axis2DownOut := FALSE; (*reset*)
  END_IF;
  F_TRIG13(CLK := Z_Axis2DownSensor);
  IF F_TRIG13.Q AND Z_Axis2DownOut AND NOT(X_Axis2MoveOut) AND NOT(RightClampOut) AND BeginAssembly AND NOT(LeftClampOut) THEN
    X_Axis2MoveOut := FALSE; (*reset*)
  END_IF;
  F_TRIG14(CLK := Z_Axis2DownSensor);
  IF NOT(Gripper2ONOut) AND F_TRIG14.Q AND NOT(Z_Axis2DownOut) AND NOT(X_Axis2MoveOut) AND NOT(RightClampOut) AND BeginAssembly THEN
    LeftPos4_Raise := TRUE; (*set*)
  END_IF;
  F_TRIG15(CLK := DiffuseSensor6);
  IF F_TRIG15.Q AND LeftPos4_Raise OR NOT(FactoryIORunning) THEN
    Z_Axis2DownOut := FALSE; (*reset*)
  END_IF;
  F_TRIG16(CLK := DiffuseSensor6);
  IF F_TRIG16.Q AND LeftPos4_Raise THEN
    X_Axis2MoveOut := FALSE; (*reset*)
  END_IF;
  F_TRIG17(CLK := DiffuseSensor6);
  IF F_TRIG17.Q AND LeftPos4_Raise THEN
    RightClampOut := FALSE; (*reset*)
  END_IF;
  StackEmitter := Conv6m_2_StackFeeder;
  F_TRIG18(CLK := DiffuseSensor6);
  IF F_TRIG18.Q AND LeftPos4_Raise THEN
    Gripper2ONOut := FALSE; (*reset*)
  END_IF;
  F_TRIG19(CLK := DiffuseSensor6);
  IF F_TRIG19.Q AND LeftPos4_Raise THEN
    LeftClampOut := FALSE; (*reset*)
  END_IF;
  F_TRIG20(CLK := DiffuseSensor6);
  IF F_TRIG20.Q AND LeftPos4_Raise THEN
    BeginAssembly := FALSE; (*reset*)
  END_IF;
  F_TRIG21(CLK := DiffuseSensor6);
  IF F_TRIG21.Q AND LeftPos4_Raise THEN
    LeftPos4_Raise := FALSE; (*reset*)
  END_IF;
  F_TRIG22(CLK := DiffuseSensor5);
  IF F_TRIG22.Q AND FactoryIORunning THEN
    StopFeederConveyor := TRUE; (*set*)
  END_IF;
  R_TRIG1(CLK := LeftPos4_Raise);
  IF R_TRIG1.Q AND FactoryIORunning OR NOT(FactoryIORunning) THEN
    StopFeederConveyor := FALSE; (*reset*)
  END_IF;
  IF NOT(FactoryIORunning) THEN
    Z_Axis2DownOut := FALSE; (*reset*)
  END_IF;
  IF NOT(FactoryIORunning) THEN
    X_Axis2MoveOut := FALSE; (*reset*)
  END_IF;
  IF NOT(FactoryIORunning) THEN
    RightClampOut := FALSE; (*reset*)
  END_IF;
  IF NOT(FactoryIORunning) THEN
    Gripper2ONOut := FALSE; (*reset*)
  END_IF;
  IF NOT(FactoryIORunning) THEN
    LeftClampOut := FALSE; (*reset*)
  END_IF;
  IF NOT(FactoryIORunning) THEN
    BeginAssembly := FALSE; (*reset*)
  END_IF;
  IF NOT(FactoryIORunning) THEN
    LeftPos4_Raise := FALSE; (*reset*)
  END_IF;
  IF NOT(FactoryIORunning) THEN
    PickupForStack := FALSE; (*reset*)
  END_IF;
  R_TRIG2(CLK := DiffuseSensor6);
  CTU0(CU := R_TRIG2.Q, R := NOT(FactoryIORunning), PV := 100);
  CratedProductCount := CTU0.CV;
END_PROGRAM


CONFIGURATION Config0

  RESOURCE Res0 ON PLC
    VAR_GLOBAL
      FactoryIORunning AT %IX100.4 : BOOL;
      BasesCenterBusy AT %IX101.2 : BOOL;
      LidsCenterBusy AT %IX100.2 : BOOL;
      FactoryIORun AT %QX100.6 : BOOL;
      SCADASetProductCount AT %QW106 : INT := 20;
      AssembledProductCount AT %QW102 : INT;
      SCADAFactoryIOStart AT %QW107 : INT;
      AssemblyEStop2 AT %IX105.3 : BOOL;
      AssemblyResetPB2 AT %IX105.4 : BOOL;
      AssemblyStartPB3 AT %IX105.5 : BOOL;
      SCADAEStop AT %QW108 : INT;
      SCADAEStopReset AT %QW111 : INT;
      QCStationEnable AT %QW115 : INT;
      Emitter2_Part_Base AT %QW109 : INT := 16;
      Emitter1_Part_Lids AT %QW110 : INT := 16;
      EStopGlobal : BOOL;
    END_VAR
    TASK task0(INTERVAL := T#20ms,PRIORITY := 0);
    TASK task1(INTERVAL := T#20ms,PRIORITY := 0);
    PROGRAM instance0 WITH task0 : Lids_Production;
    PROGRAM instance2 WITH task0 : Assembly;
    PROGRAM instance3 WITH task0 : Palletizer;
    PROGRAM instance1 WITH task1 : Base_Production;
    PROGRAM instance4 WITH task1 : Warehouse;
  END_RESOURCE
END_CONFIGURATION
