
export interface Schedule {
    description:           string;
    escalation_policies:   EscalationPolicy[];
    final_schedule:        FinalSchedule;
    html_url:              string;
    http_cal_url:          string;
    id:                    string;
    name:                  string;
    overrides_subschedule: FinalSchedule;
    personal_http_cal_url: string;
    personal_web_cal_url:  string;
    schedule_layers:       ScheduleLayer[];
    self:                  string;
    summary:               string;
    teams:                 EscalationPolicy[];
    time_zone:             string;
    type:                  string;
    users:                 EscalationPolicy[];
    web_cal_url:           string;
}

export interface EscalationPolicy {
    html_url: string;
    id:       string;
    self:     string;
    summary:  string;
    type:     Type;
}

export enum Type {
    EscalationPolicyReference = "escalation_policy_reference",
    TeamReference = "team_reference",
    UserReference = "user_reference",
}

export interface FinalSchedule {
    name:                         string;
    rendered_coverage_percentage: number;
    rendered_schedule_entries:    RenderedScheduleEntry[];
}

export interface RenderedScheduleEntry {
    end:   Date;
    id:    string;
    start: Date;
    user:  EscalationPolicy;
}

export interface ScheduleLayer {
    end:                          null;
    id:                           string;
    name:                         string;
    rendered_coverage_percentage: number;
    rendered_schedule_entries:    RenderedScheduleEntry[];
    restrictions:                 any[];
    rotation_turn_length_seconds: number;
    rotation_virtual_start:       Date;
    start:                        Date;
    users:                        User[];
}

export interface User {
    user: EscalationPolicy;
}
