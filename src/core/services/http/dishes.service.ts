import {Injectable} from '@angular/core';
import {CommonHttpService} from "@core/services/http/common-http.service";
import {Dish} from "@core/models/dish";
import {map, Observable} from "rxjs";
import {CopyDishParams} from "@core/lib/interfaces/copy-menu-dish-params";
import {DishStatus} from "@core/lib/interfaces/dish-data";
import {MoveDishParams} from "@core/lib/interfaces/move-dish-params";
import {MoveIngredientParams} from "@core/lib/interfaces/move-ingredient-params";
import {DishReferences} from "@core/lib/interfaces/dish-references";

export type relocateType = {
  dish_ids: number[],
  to_category_id: number
} |  {
  dish_ids: number[],
  from_category_id: number
} | {
  dish_ids: number[],
  to_category_id: number,
  from_category_id: number
};

@Injectable({
  providedIn: 'root'
})
export class DishesService extends CommonHttpService<Dish> {

  constructor() {
    super(Dish, `admin/menu/dishes`);
  }

  bulkUpdateStatus(data: { dish_ids: number[], status: DishStatus }): Observable<{ok: true}> {
    return this.patch<{ok: true}>(`bulk_status/${data.status}`, { dish_ids: data.dish_ids });
  }

  relocate(data: relocateType): Observable<{ok: true}> {
    return this.patch<{ok: true}>(`relocate`, data);
  }

  updatePrices(data: { amount: number, filters?: Record<string, string | number | boolean> } |  { percent: number, filters?: Record<string, string | number | boolean> }): Observable<{ success: true, details: {id: number, price: number}[] }> {
    if (data.filters == undefined || data.filters == null) delete data.filters;

    return this.patch<{ success: true, details: {id: number, price: number}[] }>(`update_prices`, data);
  };

  copy(id: number, params: CopyDishParams): Observable<Dish> {
    return this.post(`${id}/copy`, params).pipe(
      map((data: unknown) => this.mapItem(data))
    );
  }

  move(id: number, data: MoveDishParams): Observable<Dish> {
    return this.patch(`${id}/move`, data).pipe(
      map((data: unknown) => this.mapItem(data))
    );
  }

  moveIngredient(dishId: number, ingredientId: number, toIndex: number): Observable<Dish> {
    return this.patch(`${dishId}/ingredients/${ingredientId}/move`, {to_index: toIndex}).pipe(
      map((data: unknown) => this.mapItem(data))
    );
  }

  moveTag(dishId: number, tagId: number, toIndex: number): Observable<Dish> {
    return this.patch(`${dishId}/tags/${tagId}/move`, {to_index: toIndex}).pipe(
      map((data: unknown) => this.mapItem(data))
    );
  }

  moveAllergen(dishId: number, allergenId: number, toIndex: number): Observable<Dish> {
    return this.patch(`${dishId}/allergens/${allergenId}/move`, {to_index: toIndex}).pipe(
      map((data: unknown) => this.mapItem(data))
    );
  }

  updateStatus(id: number, status: DishStatus): Observable<Dish> {
    return this.patch(`${id}/status/${status}`, {}).pipe(
      map((data: unknown) => this.mapItem(data))
    );
  }

  addIngredient(dishId: number, ingredientId: number): Observable<Dish> {
    return this.post(`${dishId}/ingredients/${ingredientId}`, {}).pipe(
      map((data: unknown) => this.mapItem(data))
    )
  }

  removeIngredient(dishId: number, ingredientId: number): Observable<Dish> {
    return this.delete(`${dishId}/ingredients/${ingredientId}`).pipe(
      map((data: unknown) => this.mapItem(data))
    );
  }

  addTag(dishId: number, tagId: number): Observable<Dish> {
    return this.post(`${dishId}/tags/${tagId}`, {}).pipe(
      map((data: unknown) => this.mapItem(data))
    );
  }

  removeTag(dishId: number, tagId: number): Observable<Dish> {
    return this.delete(`${dishId}/tags/${tagId}`).pipe(
      map((data: unknown) => this.mapItem(data))
    );
  }

  addAllergen(dishId: number, allergenId: number): Observable<Dish> {
    return this.post(`${dishId}/allergens/${allergenId}`, {}).pipe(
      map((data: unknown) => this.mapItem(data))
    );
  }

  removeAllergen(dishId: number, allergenId: number): Observable<Dish> {
    return this.delete(`${dishId}/allergens/${allergenId}`).pipe(
      map((data: unknown) => this.mapItem(data))
    );
  }

  references(dishId: number): Observable<DishReferences> {
    return this.get(`${dishId}/references`).pipe(
      map((data: unknown) => data as DishReferences)
    );
  }

  addSuggestion(dishId: number, suggestionId: number): Observable<Dish> {
    return this.post(`${dishId}/suggestions/${suggestionId}`, {}).pipe(
      map((data: unknown) => this.mapItem(data))
    );
  }

  removeSuggestion(dishId: number, suggestionId: number): Observable<Dish> {
    return this.delete(`${dishId}/suggestions/${suggestionId}`).pipe(
      map((data: unknown) => this.mapItem(data))
    );
  }
}