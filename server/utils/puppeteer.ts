import puppeteer from 'puppeteer';

export async function packScraper(packUrl: string) {
	try {
		const browser = await puppeteer.launch();
		const page = await browser.newPage();
		// navigate to link
		await page.goto(packUrl);

		const pack_name = await page.$eval(
			'div.lpList > .lpListName',
			(result) => result.textContent || 'Pack',
		);

		const pack_description = await page.$eval(
			'#lpListDescription > p',
			(result) => result.textContent || '',
		);

		// get categories for each pack
		const pack_categories = await page.$$eval('.lpCategory', (categories) => {
			const content = categories.map((category, pack_category_index) => {
				const pack_category_name =
					category.querySelector('.lpCategoryName')?.textContent?.trim() || 'Category';

				// get pack items for each category
				const initialPackItems = Array.from(category.querySelectorAll('.lpItem'));

				const pack_items = initialPackItems.map((packItem, pack_item_index) => {
					const pack_item_name =
						packItem.querySelector('.lpName')?.textContent?.trim() || 'Pack Item';

					// @ts-expect-error: href exists for <a> tag inside .lpName class
					const pack_item_url = packItem.querySelector('.lpName > a')?.href || null;

					const pack_item_description =
						packItem.querySelector('.lpDescription')?.textContent?.trim() || null;

					const pack_item_quantity =
						Number(packItem.querySelector('.lpQtyCell')?.textContent?.trim()) || 1;

					const pack_item_weight =
						Number(
							packItem.querySelector('.lpWeightCell > .lpWeight')?.textContent?.trim(),
						) || 0;

					const pack_item_unit =
						packItem
							.querySelector('.lpWeightCell > .lpUnitSelect > .lpDisplay')
							?.textContent?.trim() || 0;

					const pack_item_price =
						packItem
							.querySelector('.lpPriceCell')
							?.textContent?.trim()
							.replace(/[^0-9\.-]+/g, '') || 0;

					// action buttons: favorite, worn weight, and consumable
					const actionButtons = Array.from(
						packItem.querySelectorAll('.lpActionsCell > .lpSprite'),
					);

					let worn_weight = false;
					let consumable = false;
					let favorite = false;

					actionButtons.map((button) => {
						const classList = Object.values(button.classList);
						if (classList.includes('lpActive')) {
							if (classList.includes('lpWorn')) worn_weight = true;
							if (classList.includes('lpConsumable')) consumable = true;
						}
						// favorite is active when class lpStar1 is assigned
						if (classList.includes('lpStar1')) favorite = true;
					});

					return {
						pack_item_name,
						pack_item_description,
						pack_item_quantity,
						pack_item_weight,
						pack_item_unit,
						pack_item_price,
						worn_weight,
						consumable,
						favorite,
						pack_item_url,
						pack_item_index,
					};
				});

				return { pack_category_name, pack_category_index, pack_items };
			});
			return content;
		});

		return { pack_name, pack_description, pack_categories };
	} catch (err) {
		return new Error('There was an error importing the pack.');
	}
}
