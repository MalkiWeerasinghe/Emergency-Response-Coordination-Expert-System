% =========================================
% EMERGENCY RESPONSE EXPERT SYSTEM DATA
% =========================================

:- dynamic available/1.

% =========================================
% UNITS
% unit(Name, Type, Distance)
% =========================================

unit(fire_team_a, fire, 12, 18).
unit(fire_team_b, fire, 45, 60).

unit(medical_team_a, medical, 8, 15).
unit(medical_team_b, medical, 30, 40).

unit(police_team_a, police, 10, 10).
unit(police_team_b, police, 50, 20).

unit(rescue_team_a, rescue, 15, 25).
unit(rescue_team_b, rescue, 70, 80).

unit(hazmat_team_a, hazmat, 25, 30).
unit(hazmat_team_b, hazmat, 60, 50).

unit(drone_team_a, surveillance, 5, 5).
unit(drone_team_b, surveillance, 40, 80).

unit(engineering_team_a, engineering, 35, 10).
unit(engineering_team_b, engineering, 80, 20).

unit(k9_team_a, k9, 14, 22).
unit(k9_team_b, k9, 55, 65).


% =========================================
% AVAILABLE UNITS (initial state)
% =========================================

available(fire_team_a).
available(medical_team_a).
available(police_team_a).
available(rescue_team_a).
available(hazmat_team_a).
available(drone_team_a).
available(engineering_team_a).
available(k9_team_a).


% =========================================
% PRIMARY UNIT MAPPING
% primary_unit(Incident, UnitType)
% =========================================

primary_unit(fire, fire).
primary_unit(industrial_explosion, fire).
primary_unit(gas_leak, fire).

primary_unit(accident, medical).
primary_unit(medical_emergency, medical).

primary_unit(security_breach, police).
primary_unit(border_intrusion, police).
primary_unit(public_disorder, police).

primary_unit(flood, rescue).
primary_unit(landslide, rescue).

primary_unit(chemical_leak, hazmat).
primary_unit(toxic_spill, hazmat).

primary_unit(building_collapse, engineering).
primary_unit(bridge_damage, engineering).

primary_unit(missing_person, k9).


% =========================================
% SUPPORT UNIT MAPPING
% supports(UnitType, Incident)
% =========================================

% FIRE INCIDENTS
supports(medical, fire).
supports(police, fire).
supports(surveillance, fire).

supports(medical, industrial_explosion).
supports(police, industrial_explosion).
supports(rescue, industrial_explosion).
supports(hazmat, industrial_explosion).

supports(medical, gas_leak).
supports(police, gas_leak).

% MEDICAL INCIDENTS
supports(police, accident).
supports(rescue, accident).

supports(police, medical_emergency).

% SECURITY INCIDENTS
supports(surveillance, security_breach).
supports(k9, security_breach).
supports(medical, security_breach).

supports(surveillance, border_intrusion).
supports(k9, border_intrusion).
supports(medical, border_intrusion).

supports(medical, public_disorder).
supports(surveillance, public_disorder).

% RESCUE INCIDENTS
supports(medical, flood).
supports(police, flood).
supports(engineering, flood).
supports(surveillance, flood).

supports(medical, landslide).
supports(police, landslide).
supports(engineering, landslide).

% HAZMAT INCIDENTS
supports(fire, chemical_leak).
supports(medical, chemical_leak).
supports(police, chemical_leak).

supports(fire, toxic_spill).
supports(medical, toxic_spill).
supports(police, toxic_spill).

% ENGINEERING INCIDENTS
supports(rescue, building_collapse).
supports(medical, building_collapse).
supports(police, building_collapse).
supports(surveillance, building_collapse).

supports(police, bridge_damage).
supports(surveillance, bridge_damage).

% K9 INCIDENTS
supports(police, missing_person).
supports(medical, missing_person).
supports(surveillance, missing_person).
supports(rescue, missing_person).
