-- Support adding a book that's already partway through.

alter table books add column starting_page integer not null default 0;
alter table books add constraint starting_page_non_negative check (starting_page >= 0);
alter table books add constraint starting_page_within_book check (starting_page <= page_count);
