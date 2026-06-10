% =========================================
% EMERGENCY RESPONSE EXPERT SYSTEM RULES
% =========================================

:- consult('data.pl').


% =========================================
% NEAREST UNIT LOGIC
% Finds nearest unit from a list
% =========================================

nearest([U], U).

nearest([unit(N1,D1), unit(_,D2)|Rest], Best) :-
    D1 =< D2,
    nearest([unit(N1,D1)|Rest], Best).

nearest([unit(_,D1), unit(N2,D2)|Rest], Best) :-
    D1 > D2,
    nearest([unit(N2,D2)|Rest], Best).


% =========================================
% FIND NEAREST AVAILABLE UNIT OF TYPE
% Example: fire -> fire_team_a
% =========================================

% =========================================
% DYNAMIC DISTANCE CALCULATION
% Computes Euclidean distance between coordinates
% =========================================

calculate_distance(Ux, Uy, Ix, Iy, Distance) :-
    DistanceVal is sqrt((Ux - Ix)^2 + (Uy - Iy)^2),
    % Format distance to 2 decimal places
    Distance is round(DistanceVal * 100) / 100.


% =========================================
% FIND NEAREST AVAILABLE UNIT OF TYPE AT COORDINATES
% =========================================

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


% =========================================
% PRIMARY RESPONSE (CRITICAL PATH)
% =========================================

primary_response(Incident, Ix, Iy, Primary) :-
    primary_unit(Incident, Type),
    nearest_available(Type, Ix, Iy, Primary).


% =========================================
% SUPPORT RESPONSE LIST
% =========================================

support_responses(Incident, Ix, Iy, SupportList) :-
    findall(
        unit(Name, Dist),
        (
            supports(Type, Incident),
            nearest_available(Type, Ix, Iy, unit(Name, Dist))
        ),
        SupportList
    ).


% =========================================
% FORMAT UNIT OUTPUT
% Converts unit(Name,Dist) → readable string
% =========================================

format_unit(unit(Name,Dist), String) :-
    atomic_list_concat([Name, ' (', Dist, ' km)'], String).


% =========================================
% FORMAT LIST OF UNITS
% =========================================

format_units([], []).

format_units([H|T], [S|ST]) :-
    format_unit(H, S),
    format_units(T, ST).


% =========================================
% RECOMMENDATION ENGINE (NORMAL)
% =========================================

recommend(Incident, Ix, Iy, normal, Output) :-
    primary_response(Incident, Ix, Iy, Primary),
    format_unit(Primary, PrimaryStr),
    atomic_list_concat(['PRIMARY: ', PrimaryStr], Output).


% =========================================
% RECOMMENDATION ENGINE (CRITICAL)
% =========================================

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


% =========================================
% DISPATCH & RELEASE COORDINATION
% Marks unit as busy / free
% =========================================

dispatch_unit(Name) :-
    unit(Name, _, _, _),
    available(Name),
    retract(available(Name)).


release_unit(Name) :-
    unit(Name, _, _, _),
    \+ available(Name),
    assertz(available(Name)).