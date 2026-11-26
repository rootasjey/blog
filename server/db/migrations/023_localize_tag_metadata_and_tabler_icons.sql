ALTER TABLE tags ADD COLUMN title_fr TEXT NOT NULL DEFAULT '';
ALTER TABLE tags ADD COLUMN title_en TEXT NOT NULL DEFAULT '';
ALTER TABLE tags ADD COLUMN description_fr TEXT NOT NULL DEFAULT '';
ALTER TABLE tags ADD COLUMN description_en TEXT NOT NULL DEFAULT '';
ALTER TABLE tags ADD COLUMN icon_svg TEXT;

UPDATE tags
SET title_fr = name,
    title_en = name,
    description_fr = description,
    description_en = description;
