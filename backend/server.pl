:- use_module(library(http/thread_httpd)).
:- use_module(library(http/http_dispatch)).
:- use_module(library(http/http_json)).
:- use_module(library(http/json)).
:- use_module(library(http/http_parameters)).
:- use_module(library(http/http_cors)).
:- use_module(library(option)).

:- set_setting(http:cors, [*]).

:- consult('main.pl').

% -------------------------
% API ROUTES
% -------------------------
:- http_handler('/recommend', recommend_handler, []).
:- http_handler('/units', units_handler, []).
:- http_handler('/dispatch', dispatch_handler, []).
:- http_handler('/release', release_handler, []).
:- http_handler('/landmarks', landmarks_handler, []).

server(Port) :-
    http_server(http_dispatch, [port(Port)]).

% Helper to query status of all units
get_all_units(UnitsList) :-
    findall(
        _{name: Name, type: Type, x: X, y: Y, available: IsAvailable},
        (
            unit(Name, Type, X, Y),
            (   available(Name)
            ->  IsAvailable = true
            ;   IsAvailable = false
            )
        ),
        UnitsList
    ).

recommend_handler(Request) :-
    (   option(method(options), Request)
    ->  cors_enable(Request, [methods([get, post, options])]),
        format('~n')
    ;   cors_enable,
        http_parameters(Request, [
            incident(Incident, []),
            severity(Severity, []),
            x(XVal, [float]),
            y(YVal, [float])
        ]),
        (   primary_unit(Incident, PrimaryType)
        ->  (   primary_response(Incident, XVal, YVal, Primary)
            ->  format_unit(Primary, PrimaryStr)
            ;   atomic_list_concat(['All ', PrimaryType, ' units are currently busy.'], PrimaryStr)
            )
        ;   PrimaryStr = 'No primary unit mapped'
        ),
        (   Severity = critical
        ->  (   support_responses(Incident, XVal, YVal, SupportList),
                SupportList \= []
            ->  format_units(SupportList, SupportStrs),
                atomic_list_concat(SupportStrs, ', ', SupportStr)
            ;   (   supports(_, Incident)
                ->  SupportStr = 'All supporting units are currently busy.'
                ;   SupportStr = 'No support units mapped'
                )
            )
        ;   SupportStr = 'No support units required'
        ),
        reply_json_dict(_{
            incident: Incident,
            severity: Severity,
            primary: PrimaryStr,
            support: SupportStr
        })
    ).

units_handler(Request) :-
    (   option(method(options), Request)
    ->  cors_enable(Request, [methods([get, post, options])]),
        format('~n')
    ;   cors_enable,
        get_all_units(Units),
        reply_json_dict(Units)
    ).

dispatch_handler(Request) :-
    (   option(method(options), Request)
    ->  cors_enable(Request, [methods([get, post, options])]),
        format('~n')
    ;   cors_enable,
        http_parameters(Request, [
            unit(Unit, [atom])
        ]),
        (   dispatch_unit(Unit)
        ->  reply_json_dict(_{success: true, message: "Unit successfully dispatched"})
        ;   reply_json_dict(_{success: false, message: "Unit is not available or does not exist"})
        )
    ).

release_handler(Request) :-
    (   option(method(options), Request)
    ->  cors_enable(Request, [methods([get, post, options])]),
        format('~n')
    ;   cors_enable,
        http_parameters(Request, [
            unit(Unit, [atom])
        ]),
        (   release_unit(Unit)
        ->  reply_json_dict(_{success: true, message: "Unit successfully released"})
        ;   reply_json_dict(_{success: false, message: "Unit is already available or does not exist"})
        )
    ).

landmarks_handler(Request) :-
    (   option(method(options), Request)
    ->  cors_enable(Request, [methods([get, options])]),
        format('~n')
    ;   cors_enable,
        findall(
            _{name: Name, x: X, y: Y},
            landmark(Name, X, Y),
            Landmarks
        ),
        reply_json_dict(Landmarks)
    ).