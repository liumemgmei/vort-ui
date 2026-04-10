<script setup lang="ts">
import { computed, inject } from "vue";
import { rowContextKey } from "./types";

defineOptions({ name: "VortCol" });

/** Vort Col - 栅格列组件 */

type ColSpan = number | string;

interface ColSize {
    span?: ColSpan;
    offset?: number;
    order?: number;
    pull?: number;
    push?: number;
}

const BREAKPOINTS = ["xs", "sm", "md", "lg", "xl", "xxl"] as const;

interface Props {
    /** 栅格占位格数，0 时相当于 display: none */
    span?: ColSpan;
    /** 栅格左侧的间隔格数 */
    offset?: number;
    /** 栅格顺序 */
    order?: number;
    /** 栅格向左移动格数 */
    pull?: number;
    /** 栅格向右移动格数 */
    push?: number;
    /** flex 布局属性 */
    flex?: string | number;
    /** 响应式 - xs 屏幕 < 576px */
    xs?: ColSpan | ColSize;
    /** 响应式 - sm 屏幕 ≥ 576px */
    sm?: ColSpan | ColSize;
    /** 响应式 - md 屏幕 ≥ 768px */
    md?: ColSpan | ColSize;
    /** 响应式 - lg 屏幕 ≥ 992px */
    lg?: ColSpan | ColSize;
    /** 响应式 - xl 屏幕 ≥ 1200px */
    xl?: ColSpan | ColSize;
    /** 响应式 - xxl 屏幕 ≥ 1600px */
    xxl?: ColSpan | ColSize;
    /** 自定义类名 */
    class?: string;
}

const props = withDefaults(defineProps<Props>(), {
    span: undefined,
    offset: 0,
    order: 0,
    pull: 0,
    push: 0
});

const rowContext = inject(rowContextKey, null);

const gutterPadding = computed(() => {
    if (!rowContext) return 0;
    return rowContext.gutter[0] / 2;
});

function parseSpan(val: ColSpan): number {
    return typeof val === "string" ? parseInt(val, 10) : val;
}

function normalizeColSize(val: ColSpan | ColSize | undefined): ColSize | undefined {
    if (val === undefined) return undefined;
    if (typeof val === "number" || typeof val === "string") return { span: val };
    return val;
}

const hasResponsive = computed(() => BREAKPOINTS.some((bp) => props[bp] !== undefined));

const colClasses = computed(() => {
    const classes: string[] = ["vort-col"];

    if (props.span !== undefined || hasResponsive.value) {
        classes.push("vort-col-sized");
    }

    if (props.span !== undefined && parseSpan(props.span) === 0) {
        classes.push("vort-col-hidden");
    }

    for (const bp of BREAKPOINTS) {
        const size = normalizeColSize(props[bp]);
        if (!size) continue;
        classes.push(`vort-col-${bp}`);
        if (size.span !== undefined && parseSpan(size.span) === 0) {
            classes.push(`vort-col-${bp}-hidden`);
        }
    }

    if (props.class) classes.push(props.class);
    return classes;
});

const colStyle = computed(() => {
    const style: Record<string, string> = {};

    if (gutterPadding.value > 0) {
        style.paddingLeft = `${gutterPadding.value}px`;
        style.paddingRight = `${gutterPadding.value}px`;
    }

    if (props.flex !== undefined) {
        if (typeof props.flex === "number") {
            style.flex = `${props.flex} ${props.flex} auto`;
        } else {
            style.flex = props.flex;
        }
    }

    const hasSizing = props.span !== undefined || hasResponsive.value;

    if (hasSizing) {
        if (props.span !== undefined) style["--col-span"] = String(parseSpan(props.span));
        if (props.offset) style["--col-offset"] = String(props.offset);
        if (props.order) style["--col-order"] = String(props.order);
        if (props.pull) style["--col-pull"] = String(props.pull);
        if (props.push) style["--col-push"] = String(props.push);

        for (const bp of BREAKPOINTS) {
            const size = normalizeColSize(props[bp]);
            if (!size) continue;
            if (size.span !== undefined) style[`--col-${bp}-span`] = String(parseSpan(size.span));
            if (size.offset !== undefined) style[`--col-${bp}-offset`] = String(size.offset);
            if (size.order !== undefined) style[`--col-${bp}-order`] = String(size.order);
            if (size.pull !== undefined) style[`--col-${bp}-pull`] = String(size.pull);
            if (size.push !== undefined) style[`--col-${bp}-push`] = String(size.push);
        }
    } else {
        if (props.offset > 0) style.marginLeft = `${(props.offset / 24) * 100}%`;
        if (props.order !== 0) style.order = String(props.order);
        if (props.pull > 0) style.right = `${(props.pull / 24) * 100}%`;
        if (props.push > 0) style.left = `${(props.push / 24) * 100}%`;
    }

    return style;
});
</script>

<template>
    <div :class="colClasses" :style="colStyle">
        <slot />
    </div>
</template>

<style scoped>
.vort-col {
    position: relative;
    min-height: 1px;
    box-sizing: border-box;
}

/* ========== Base sizing (no breakpoint) ========== */
.vort-col-sized {
    flex: 0 0 calc(var(--col-span, 24) / 24 * 100%);
    max-width: calc(var(--col-span, 24) / 24 * 100%);
    margin-left: calc(var(--col-offset, 0) / 24 * 100%);
    order: var(--col-order, 0);
    right: calc(var(--col-pull, 0) / 24 * 100%);
    left: calc(var(--col-push, 0) / 24 * 100%);
}

.vort-col-sized.vort-col-hidden {
    display: none;
}

/* ========== xs: < 576px (mobile-first base, no media query) ========== */
.vort-col-sized.vort-col-xs {
    display: block;
    flex: 0 0 calc(var(--col-xs-span, var(--col-span, 24)) / 24 * 100%);
    max-width: calc(var(--col-xs-span, var(--col-span, 24)) / 24 * 100%);
    margin-left: calc(var(--col-xs-offset, var(--col-offset, 0)) / 24 * 100%);
    order: var(--col-xs-order, var(--col-order, 0));
    right: calc(var(--col-xs-pull, var(--col-pull, 0)) / 24 * 100%);
    left: calc(var(--col-xs-push, var(--col-push, 0)) / 24 * 100%);
}

.vort-col-xs.vort-col-xs-hidden {
    display: none;
}

/* ========== sm: ≥ 576px ========== */
@media (min-width: 576px) {
    .vort-col-sized.vort-col-sm {
        display: block;
        flex: 0 0 calc(var(--col-sm-span, var(--col-xs-span, var(--col-span, 24))) / 24 * 100%);
        max-width: calc(var(--col-sm-span, var(--col-xs-span, var(--col-span, 24))) / 24 * 100%);
        margin-left: calc(var(--col-sm-offset, var(--col-xs-offset, var(--col-offset, 0))) / 24 * 100%);
        order: var(--col-sm-order, var(--col-xs-order, var(--col-order, 0)));
        right: calc(var(--col-sm-pull, var(--col-xs-pull, var(--col-pull, 0))) / 24 * 100%);
        left: calc(var(--col-sm-push, var(--col-xs-push, var(--col-push, 0))) / 24 * 100%);
    }

    .vort-col-sm.vort-col-sm-hidden {
        display: none;
    }
}

/* ========== md: ≥ 768px ========== */
@media (min-width: 768px) {
    .vort-col-sized.vort-col-md {
        display: block;
        flex: 0 0 calc(var(--col-md-span, var(--col-sm-span, var(--col-xs-span, var(--col-span, 24)))) / 24 * 100%);
        max-width: calc(var(--col-md-span, var(--col-sm-span, var(--col-xs-span, var(--col-span, 24)))) / 24 * 100%);
        margin-left: calc(var(--col-md-offset, var(--col-sm-offset, var(--col-xs-offset, var(--col-offset, 0)))) / 24 * 100%);
        order: var(--col-md-order, var(--col-sm-order, var(--col-xs-order, var(--col-order, 0))));
        right: calc(var(--col-md-pull, var(--col-sm-pull, var(--col-xs-pull, var(--col-pull, 0)))) / 24 * 100%);
        left: calc(var(--col-md-push, var(--col-sm-push, var(--col-xs-push, var(--col-push, 0)))) / 24 * 100%);
    }

    .vort-col-md.vort-col-md-hidden {
        display: none;
    }
}

/* ========== lg: ≥ 992px ========== */
@media (min-width: 992px) {
    .vort-col-sized.vort-col-lg {
        display: block;
        flex: 0 0 calc(var(--col-lg-span, var(--col-md-span, var(--col-sm-span, var(--col-xs-span, var(--col-span, 24))))) / 24 * 100%);
        max-width: calc(var(--col-lg-span, var(--col-md-span, var(--col-sm-span, var(--col-xs-span, var(--col-span, 24))))) / 24 * 100%);
        margin-left: calc(var(--col-lg-offset, var(--col-md-offset, var(--col-sm-offset, var(--col-xs-offset, var(--col-offset, 0))))) / 24 * 100%);
        order: var(--col-lg-order, var(--col-md-order, var(--col-sm-order, var(--col-xs-order, var(--col-order, 0)))));
        right: calc(var(--col-lg-pull, var(--col-md-pull, var(--col-sm-pull, var(--col-xs-pull, var(--col-pull, 0))))) / 24 * 100%);
        left: calc(var(--col-lg-push, var(--col-md-push, var(--col-sm-push, var(--col-xs-push, var(--col-push, 0))))) / 24 * 100%);
    }

    .vort-col-lg.vort-col-lg-hidden {
        display: none;
    }
}

/* ========== xl: ≥ 1200px ========== */
@media (min-width: 1200px) {
    .vort-col-sized.vort-col-xl {
        display: block;
        flex: 0 0 calc(var(--col-xl-span, var(--col-lg-span, var(--col-md-span, var(--col-sm-span, var(--col-xs-span, var(--col-span, 24)))))) / 24 * 100%);
        max-width: calc(var(--col-xl-span, var(--col-lg-span, var(--col-md-span, var(--col-sm-span, var(--col-xs-span, var(--col-span, 24)))))) / 24 * 100%);
        margin-left: calc(var(--col-xl-offset, var(--col-lg-offset, var(--col-md-offset, var(--col-sm-offset, var(--col-xs-offset, var(--col-offset, 0)))))) / 24 * 100%);
        order: var(--col-xl-order, var(--col-lg-order, var(--col-md-order, var(--col-sm-order, var(--col-xs-order, var(--col-order, 0))))));
        right: calc(var(--col-xl-pull, var(--col-lg-pull, var(--col-md-pull, var(--col-sm-pull, var(--col-xs-pull, var(--col-pull, 0)))))) / 24 * 100%);
        left: calc(var(--col-xl-push, var(--col-lg-push, var(--col-md-push, var(--col-sm-push, var(--col-xs-push, var(--col-push, 0)))))) / 24 * 100%);
    }

    .vort-col-xl.vort-col-xl-hidden {
        display: none;
    }
}

/* ========== xxl: ≥ 1600px ========== */
@media (min-width: 1600px) {
    .vort-col-sized.vort-col-xxl {
        display: block;
        flex: 0 0 calc(var(--col-xxl-span, var(--col-xl-span, var(--col-lg-span, var(--col-md-span, var(--col-sm-span, var(--col-xs-span, var(--col-span, 24))))))) / 24 * 100%);
        max-width: calc(var(--col-xxl-span, var(--col-xl-span, var(--col-lg-span, var(--col-md-span, var(--col-sm-span, var(--col-xs-span, var(--col-span, 24))))))) / 24 * 100%);
        margin-left: calc(var(--col-xxl-offset, var(--col-xl-offset, var(--col-lg-offset, var(--col-md-offset, var(--col-sm-offset, var(--col-xs-offset, var(--col-offset, 0))))))) / 24 * 100%);
        order: var(--col-xxl-order, var(--col-xl-order, var(--col-lg-order, var(--col-md-order, var(--col-sm-order, var(--col-xs-order, var(--col-order, 0)))))));
        right: calc(var(--col-xxl-pull, var(--col-xl-pull, var(--col-lg-pull, var(--col-md-pull, var(--col-sm-pull, var(--col-xs-pull, var(--col-pull, 0))))))) / 24 * 100%);
        left: calc(var(--col-xxl-push, var(--col-xl-push, var(--col-lg-push, var(--col-md-push, var(--col-sm-push, var(--col-xs-push, var(--col-push, 0))))))) / 24 * 100%);
    }

    .vort-col-xxl.vort-col-xxl-hidden {
        display: none;
    }
}
</style>
