-- Add academic details to team member profiles without altering existing records.
alter table public.team_members add column if not exists year_of_study text;
alter table public.team_members add column if not exists degree_program text;

comment on column public.team_members.year_of_study is 'Student year of study: First Year, Second Year, Third Year, or Fourth Year.';
comment on column public.team_members.degree_program is 'Student degree program, e.g. B.Tech CSE (AI/ML).';
