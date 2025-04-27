import {HttpErrorResponse} from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component, computed,
  ElementRef,
  EventEmitter,
  forwardRef, Inject, inject, Injector, OnChanges,
  OnDestroy,
  OnInit, Signal, signal, SimpleChange, SimpleChanges,
  TemplateRef,
  ViewChild,
  ViewChildren, WritableSignal
} from '@angular/core';
import {ControlValueAccessor, UntypedFormControl, NG_VALUE_ACCESSOR} from '@angular/forms';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {SearchResult} from '@core/lib/search-result.model';
import {CommonHttpService} from '@core/services/http/common-http.service';
import {PolymorpheusComponent, PolymorpheusContent} from '@tinkoff/ng-polymorpheus';
import {
  ALWAYS_FALSE_HANDLER,
  TuiBooleanHandler,
  TuiStringHandler,
  TUI_DEFAULT_MATCHER,
  TuiDestroyService
} from '@taiga-ui/cdk';
import {tuiGetViewportWidth, TuiValueContentContext} from '@taiga-ui/core';
import {TuiComboBoxComponent} from '@taiga-ui/kit';
import {Observable, Subscription, merge, catchError, map, tap, takeUntil, finalize} from 'rxjs';
import {
  CommonDynamicSelectComponentInputs,
  CommonDynamicSelectComponentOutputs,
  CommonDynamicSelectComponentStyleUrls, CommonDynamicSelectModuleImports, PolymorpheusType
} from './common-dynamic-select';
import {nue} from "@core/lib/nue";

@Component({
  templateUrl: `./common-dynamic-select.component.html`,
  selector: 'app-common-dynamic-select',
  styleUrls: CommonDynamicSelectComponentStyleUrls,
  inputs: CommonDynamicSelectComponentInputs,
  outputs: CommonDynamicSelectComponentOutputs,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CommonDynamicSelectComponent),
      multi: true
    },

    TuiDestroyService,
  ],
  standalone: true,
  imports: CommonDynamicSelectModuleImports,

  /**
   * Queries will be inherited by the child components.
   */
  queries: {
    comboBox: new ViewChild(TuiComboBoxComponent)
  },
})
export class CommonDynamicSelectComponent<T> implements ControlValueAccessor, OnInit, OnDestroy, AfterViewInit, OnChanges {

  /* ****************** Outputs ****************** */
  /* @Output() */
  readonly httpError: EventEmitter<HttpErrorResponse> = new EventEmitter<HttpErrorResponse>();

  /* @Output() */
  readonly queryChange: EventEmitter<string | null> = new EventEmitter();

  /*  @Output() */
  readonly pageChange: EventEmitter<number> = new EventEmitter();

  /*  @Output() */
  readonly per_pageChange: EventEmitter<number> = new EventEmitter();

  /*  @Output() */
  readonly createNew: EventEmitter<void> = new EventEmitter<void>();

  /* ****************** ViewChild ****************** */
  /* @ViewChild(TuiComboBoxComponent) */
  comboBox?: TuiComboBoxComponent<T | any>;

  /* ****************** Inputs ****************** */
  /* @Input() */
  outputType: 'id' | 'object' = 'object';

  /* @Input() */
  showCleaner: boolean = false;

  /* @Input() */
  filters: Record<string, any> | null = null;

  /* @Input() */
  // multiple: boolean = false;

  /* @Input() */
  service: {
    search: (p: Record<string, any>) => Observable<SearchResult<T>>,
    show: (id: number) => Observable<T>
  } | null = null;

  /* @Input() */
  stringify: TuiStringHandler<T> = (item: T): string => `${item ? (item as any).toString() : ''}`;

  /* @Input() */
  query: string | null = null;

  /* @Input() */
  autofocus: boolean = false;

  /* @Input() */
  placeholder?: string;

  /* @Input() */
  set optionTemplate(v: TemplateRef<any> | null) {
    this.optionTemplate$.set(v);
  }

  readonly optionTemplate$: WritableSignal<TemplateRef<any> | null> = signal(null);

  readonly optionTemplateType$: Signal<PolymorpheusType> = computed(() => this.polymorpheusType(this.optionTemplate$()));

  /* @Input() */
  inputSize: 's' | 'm' | 'l' = 'm';

  /* @Input() */
  page: number = 1;

  /* @Input() */
  per_page: number = 30;

  /* @Input() */
  optionSize: 's' | 'm' | 'l' = this.inputSize;

  /* @Input() */
  disabledItemHandler: TuiBooleanHandler<T> = ALWAYS_FALSE_HANDLER;

  /* @Input() */
  loadMore?: string;

  /* @Input() */
  showCreateNew?: boolean;

  /**
   * When last item is focused or hovered, should the component load more items?
   */
  /* @Input() */
  loadMoreOnLastItem: boolean = false;

  /* @Input() */
  set emptyContent(v: TemplateRef<any> | string | null) {
    this.emptyContent$.set(v);
  }

  /**
   * @deprecated
   *
   * Use emptyContent$ instead.
   */
  get emptyContent(): TemplateRef<any> | string | null {
    return this.emptyContent$();
  }

  readonly emptyContent$: WritableSignal<TemplateRef<any> | string | null> = signal(null);

  /**
   * This is the actual option when the dropdown is open.
   */

  /* @Input() */
  set nativeOptionTemplate(v: PolymorpheusContent<unknown>) {
    this.nativeOptionTemplate$.set(v);
  }

  readonly nativeOptionTemplate$: WritableSignal<PolymorpheusContent<unknown>> = signal(null);

  readonly nativeOptionTemplateType$: Signal<PolymorpheusType> = computed(
    () => this.polymorpheusType(this.nativeOptionTemplate$())
  );

  readonly emptyContentTemplate: Signal<TemplateRef<any> | null> = computed((): null | TemplateRef<any> => {
    const v: TemplateRef<any> | string | null = this.emptyContent$();
    if (v == null) return null;
    if (typeof v === 'string') return null;

    return v;
  });

  readonly emptyContentString: Signal<string | null> = computed((): null | string => {
    const v: TemplateRef<any> | string | null = this.emptyContent$();
    if (v == null) return null;
    if (typeof v !== 'string') return null;

    return v;
  });

  readonly loading: Signal<boolean> = computed(() => this.searching() || this.finding());

  /* ****************** Private/protected properties ****************** */

  protected readonly searching: WritableSignal<boolean> = signal(false);
  protected readonly finding: WritableSignal<boolean> = signal(false);

  private nextPageToLoad: number | null = this.page + 1;

  protected defaultPage: number = 1;

  protected defaultPerPage: number = 30;

  private readonly destroy$: TuiDestroyService = inject(TuiDestroyService);
  // public readonly context: Record<string, any> = inject(POLYMORPHEUS_CONTEXT);
  readonly injector: Injector = inject(Injector);

  get thereAreMoreItems(): boolean {
    return this.nextPageToLoad != null;
  }

  /* ****************** Public properties ****************** */
  readonly control = new UntypedFormControl(null);

  readonly onSearchChange = (searchQuery: string | null): void => this.queryChange.next(searchQuery);

  readonly items: WritableSignal<T[]> = signal([]);

  /* ****************** Constructor ****************** */
  constructor() {
    const search = () => this.search().subscribe();
    const resetPagination = () => {
      this.page = this.defaultPage;
      this.per_page = this.defaultPerPage;
    };

    this.control.valueChanges.subscribe(() => resetPagination());

    this.queryChange.pipe(
      takeUntil(this.destroy$)
    ).subscribe((q) => {
      this.query = q;
      resetPagination();
      this.items.set([]);
      search();
    });

    merge(this.pageChange, this.per_pageChange).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => search());
  }

  /* ****************** Lifecycle hooks ****************** */

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.queryChange.next(this.query = '');
    if (this.autofocus) {
      setTimeout(() => this.focus(), 100);
    }
  }

  ngOnDestroy(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filters']) this.search().subscribe(nue());
  }

  /* ****************** Public functions ****************** */

  focus(openDropdown: boolean = true): void {
    if (!(this.comboBox)) return;
    const input: TuiComboBoxComponent<unknown> = this.comboBox;

    input.nativeFocusableElement?.focus();
    if (openDropdown) this.openDropdown();
  }

  openDropdown(): void {
    if (!this.comboBox) return;

    if (!this.comboBox.open) this.toggleDropdown();
  }

  closeDropdown(): void {
    if (!this.comboBox) return;

    if (this.comboBox.open) this.toggleDropdown();
  }

  toggleDropdown(): void {
    if (!this.comboBox) return;

    this.comboBox.toggle();
  }

  /**
   * Event emitted by the options
   */
  optionMouseEnter(index: number, isLast: boolean | null = null): void {
    if (isLast === true && this.loadMoreOnLastItem) {
      this.loadMoreItems();
    }
  }

  optionFocus(index: number, isLast: boolean | null = null): void {
    if (isLast === true && this.loadMoreOnLastItem) {
      this.loadMoreItems();
    }
  }

  updatePage(page: number): void {
    this.page = page;
    this.pageChange.next(page);
  }

  updatePerPage(per_page: number): void {
    this.per_page = per_page;
    this.per_pageChange.next(per_page);
  }

  loadMoreItems(): void {
    if (this.loading()) return;
    if (this.thereAreMoreItems) this.updatePage(this.nextPageToLoad as number);
  }

  /* ****************** ValueAccessor interface methods ****************** */
  writeValue(obj: T | any) {
    if ((typeof obj == 'number' || typeof obj == 'string') && Number(obj) == obj) return this.setValById(obj as number);
    /**
     * TODO get the object from the server if id or id[] is provided
     */
    this.control.setValue(obj);
  }

  registerOnChange(fn: any) {
    this.control.valueChanges.subscribe(() => fn(this.formatOutput()));
  }

  registerOnTouched(fn: any) {
    this.control.valueChanges.subscribe(() => fn());
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) this.control.disable();
    else this.control.enable();
  }

  /* ****************** Private functions ****************** */
  protected setValById(id: number) {
    if (!this.service) return;

    this.finding.set(true);
    const req = this.service.show(id).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.finding.set(false))
    ).subscribe({
      next: (item: T) => {
        this.writeValue(item);
        req.unsubscribe();
      }
    });
    // this.service.search({filters: JSON.stringify({id})}).subscribe(
    //   (result: SearchResult<T>) => {
    //     if (!(result.items && result.items.length > 0)) return;
    //
    //     this.writeValue(this.multiple ? result.items : result.items[0]);
    //   },
    //   () => {
    //
    //   }
    // )
  }

  protected formatOutput(value: any = this.control.value): T | number | null {
    if (!(value != null && value != undefined)) return null;

    if (this.outputType === 'id') {
      return value?.id;
    }

    return value;
  }

  protected searchParams(): { page: number, per_page: number, [key: string]: any } {
    const params: { page: number, per_page: number, [key: string]: any } = {
      ...(this.filters ?? {}),
      query: this.query,
      page: this.page,
      per_page: this.per_page
    };

    if (!(params['query'] && params['query'].length > 0)) delete params['query'];

    return params;
  }

  protected searchSub: Subscription | null = null;

  protected search(): Observable<T[]> {
    if (!(this.service)) throw new Error("service is not defined");

    // Cancel previous request
    this.searchSub?.unsubscribe();

    this.searching.set(true);
    const searchedParams = this.searchParams();
    return this.service.search(searchedParams).pipe(
      tap((data: SearchResult<T>) => {
        this.newItemsLoaded(searchedParams, data);
      }),

      map((data: SearchResult<T>) => data.items),

      catchError((e: unknown) => {
        console.error(e);
        if (e instanceof HttpErrorResponse) this.httpError.emit(e);
        return [];
      }),

      finalize(() => {
        this.searching.set(false);
        this.searchSub?.unsubscribe();
        this.searchSub = null;
      })
    );
  }

  protected findSub: Subscription | null = null;

  protected find(id: number): Observable<T | null> {

    this.findSub?.unsubscribe(); // Cancel previous request

    return new Observable<T | null>((observer) => {
      if (!(this.service)) throw new Error("service is not defined");
      if (!(this.service.show)) throw new Error("service.show is not defined");

      this.finding.set(true);
      this.findSub = this.service.show(id).pipe(
        takeUntil(this.destroy$),
        finalize(() => this.finding.set(false))
      ).subscribe(
        (response: T) => {
          observer.next(response);
          observer.complete();
        },
        (e: HttpErrorResponse) => {
          this.httpError.emit(e);
          observer.next(null);
          observer.complete();
        }
      );
    });
  }

  protected newItemsLoaded(
    requestParams: { page: number, per_page: number, [key: string]: any },
    response: SearchResult<T>): void {
    this.nextPageToLoad = response.next_page;

    const items: T[] = response.items;

    if (requestParams.page == 1 || this.items().length == 0) {
      this.items.set(items);
      return;
    }

    if (items.length == 0) return;

    const initialIndex = requestParams.per_page * ((requestParams.page - 1) || 1);
    items.forEach((item: T, index: number) => {
      // this.items[index + initialIndex] = item;
      // TODO not sure this is working properly.
      this.items.update((current: T[]) => {
        current[index + initialIndex] = item;
        return current;
      })
    });


  }

  private polymorpheusType(value: PolymorpheusContent<unknown>): PolymorpheusType {
    if (typeof value === 'string') return 'text';
    if (value instanceof TemplateRef) return 'template';
    if (typeof value === 'object' && value instanceof PolymorpheusComponent) return 'component';

    return null;
  }
}