CREATE INDEX "videos_created_at_idx" ON "videos" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "videos_category_idx" ON "videos" USING btree ("category");--> statement-breakpoint
CREATE INDEX "videos_platform_idx" ON "videos" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "videos_creator_idx" ON "videos" USING btree ("creator");--> statement-breakpoint
CREATE INDEX "videos_category_id_idx" ON "videos" USING btree ("categoryId");