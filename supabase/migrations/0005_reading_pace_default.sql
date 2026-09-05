-- One reading pace across the app: 1.25 min/page (48 pages/hour).
--
-- At a typical ~300 words per page that implies ~240 wpm, matching the measured
-- adult silent-reading average (~238 wpm, Brysbaert 2019). The previous 2.0
-- implied ~150 wpm, well below what adults actually read at, so it understated
-- how many pages a scrolling session cost.

alter table settings alter column default_minutes_per_page set default 1.25;

-- Move rows still sitting on the old default. Anything deliberately customised
-- to another value is left alone.
update settings set default_minutes_per_page = 1.25 where default_minutes_per_page = 2.0;
