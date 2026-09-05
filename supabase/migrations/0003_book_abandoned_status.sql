-- Support scrapping a book (distinct from finishing it).

alter table books drop constraint books_status_check;
alter table books add constraint books_status_check
  check (status in ('queued', 'active', 'finished', 'abandoned'));
