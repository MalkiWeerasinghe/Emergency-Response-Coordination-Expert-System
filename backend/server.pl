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
% API ROUTE
% -------------------------
:- http_handler('/recommend', recommend_handler, []).

server(Port) :-
    http_server(http_dispatch, [port(Port)]).

recommend_handler(Request) :-
    (   option(method(options), Request)
    ->  cors_enable(Request, [methods([get, post, options])]),
        format('~n')
    ;   cors_enable,
        http_parameters(Request, [
            incident(Incident, []),
            severity(Severity, [])
        ]),
        (   primary_response(Incident, Primary)
        ->  format_unit(Primary, PrimaryStr)
        ;   PrimaryStr = 'No primary unit'
        ),
        (   Severity = critical
        ->  (   support_responses(Incident, SupportList),
                SupportList \= []
            ->  format_units(SupportList, SupportStrs),
                atomic_list_concat(SupportStrs, ', ', SupportStr)
            ;   SupportStr = 'No support units'
            )
        ;   SupportStr = 'No support units'
        ),
        reply_json_dict(_{
            incident: Incident,
            severity: Severity,
            primary: PrimaryStr,
            support: SupportStr
        })
    ).