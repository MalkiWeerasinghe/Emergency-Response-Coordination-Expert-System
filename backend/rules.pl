% =============================================================================
% EMERGENCY RESPONSE EXPERT SYSTEM RULES
% =============================================================================
% Main rule engine that matches incidents to closest available responders.
% Ordered from high-level public APIs (Top) to low-level helpers/math (Bottom).

:- consult('data.pl').


% =============================================================================
% 1. PUBLIC COORDINATION APIs (Dispatch, Release & Recommendations)
% =============================================================================

% dispatch_unit(+Name)
% Marks a unit as busy / on mission by retracting its availability.
dispatch_unit(Name) :-
    unit(Name, _, _, _),
    available(Name),
    retract(available(Name)).

% release_unit(+Name)
% Marks a unit as available by asserting its availability back into memory.
release_unit(Name) :-
    unit(Name, _, _, _),
    \+ available(Name),
    assertz(available(Name)).

% recommend(+Incident, +Ix, +Iy, +Severity, -Output)
% Entry point for recommendation engine. Computes responder string based on severity.
recommend(Incident, Ix, Iy, normal, Output) :-
    primary_response(Incident, Ix, Iy, Primary),
    format_unit(Primary, PrimaryStr),
    atomic_list_concat(['PRIMARY: ', PrimaryStr], Output).

recommend(Incident, Ix, Iy, critical, Output) :-
    primary_response(Incident, Ix, Iy, Primary),
    support_responses(Incident, Ix, Iy, Supports),
    format_unit(Primary, PrimaryStr),
    format_units(Supports, SupportStrs),
    atomic_list_concat(SupportStrs, ', ', SupportText),
    atomic_list_concat(
        [
            'PRIMARY: ', PrimaryStr,
            ' | SUPPORT: ', SupportText
        ],
        Output
    ).


% =============================================================================
% 2. INTERMEDIATE SELECTION & ROUTING
% =============================================================================

% primary_response(+Incident, +Ix, +Iy, -PrimaryUnit)
% Finds the closest available primary responder unit for a given incident type.
primary_response(Incident, Ix, Iy, Primary) :-
    primary_unit(Incident, Type),
    nearest_available(Type, Ix, Iy, Primary).

% support_responses(+Incident, +Ix, +Iy, -SupportUnitsList)
% Finds all support units mapped to the incident (either available or busy status).
support_responses(Incident, Ix, Iy, SupportList) :-
    findall(
        Status,
        (
            supports(Type, Incident),
            (   nearest_available(Type, Ix, Iy, unit(Name, Dist))
            ->  Status = unit(Name, Dist)
            ;   Status = busy(Type)
            )
        ),
        SupportList
    ).


% =============================================================================
% 3. CORE GEOGRAPHIC SEARCH
% =============================================================================

% nearest_available(+Type, +Ix, +Iy, -NearestUnit)
% Finds the single nearest available unit of a specific type to incident coordinates.
nearest_available(Type, Ix, Iy, unit(Name, Dist)) :-
    findall(
        unit(N, D),
        (
            unit(N, Type, Ux, Uy),
            available(N),
            calculate_distance(Ux, Uy, Ix, Iy, D)
        ),
        Units
    ),
    Units \= [],
    nearest(Units, unit(Name, Dist)).


% =============================================================================
% 4. STRING FORMATTING UTILITIES
% =============================================================================

% format_unit(+UnitTerm, -FormattedString)
% Formats a unit(Name, Dist) term or busy(Type) status into a readable text representation.
format_unit(unit(Name,Dist), String) :-
    atomic_list_concat([Name, ' (', Dist, ' km)'], String).
format_unit(busy(Type), String) :-
    atomic_list_concat(['All ', Type, ' units are currently busy.'], String).

% format_units(+ListofUnitTerms, -ListofFormattedStrings)
% Maplist helper that recursively formats a list of unit terms.
format_units([], []).
format_units([H|T], [S|ST]) :-
    format_unit(H, S),
    format_units(T, ST).


% =============================================================================
% 5. LOW-LEVEL MATH & LIST HELPERS
% =============================================================================

% calculate_distance(+Ux, +Uy, +Ix, +Iy, -Distance)
% Computes Euclidean distance between unit coordinates and incident coordinates.
calculate_distance(Ux, Uy, Ix, Iy, Distance) :-
    DistanceVal is sqrt((Ux - Ix)^2 + (Uy - Iy)^2),
    Distance is round(DistanceVal * 100) / 100.

% nearest(+List, -BestUnit)
% Recursively finds the unit term with the minimum distance value.
nearest([U], U).

nearest([unit(N1,D1), unit(_,D2)|Rest], Best) :-
    D1 =< D2,
    nearest([unit(N1,D1)|Rest], Best).

nearest([unit(_,D1), unit(N2,D2)|Rest], Best) :-
    D1 > D2,
    nearest([unit(N2,D2)|Rest], Best).