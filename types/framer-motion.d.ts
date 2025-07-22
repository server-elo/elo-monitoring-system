declare module "framer-motion" {
  import {
    ComponentProps,
    ForwardRefExoticComponent,
    RefAttributes,
  } from "react";
  export interface MotionProps {
    initial?: any;
    animate?: any;
    exit?: any;
    transition?: any;
    variants?: any;
    whileHover?: any;
    whileTap?: any;
    whileInView?: any;
    whileFocus?: any;
    whileDrag?: any;
    drag?: any;
    dragConstraints?: any;
    dragElastic?: any;
    dragMomentum?: any;
    onDragStart?: any;
    onDragEnd?: any;
    onDrag?: any;
    layout?: any;
    layoutId?: any;
  }
  export const motion: {
    div: ForwardRefExoticComponent<
      ComponentProps<"div"> & MotionProps & RefAttributes<HTMLDivElement>
    >;
    span: ForwardRefExoticComponent<
      ComponentProps<"span"> & MotionProps & RefAttributes<HTMLSpanElement>
    >;
    p: ForwardRefExoticComponent<
      ComponentProps<"p"> & MotionProps & RefAttributes<HTMLParagraphElement>
    >;
    h1: ForwardRefExoticComponent<
      ComponentProps<"h1"> & MotionProps & RefAttributes<HTMLHeadingElement>
    >;
    h2: ForwardRefExoticComponent<
      ComponentProps<"h2"> & MotionProps & RefAttributes<HTMLHeadingElement>
    >;
    h3: ForwardRefExoticComponent<
      ComponentProps<"h3"> & MotionProps & RefAttributes<HTMLHeadingElement>
    >;
    button: ForwardRefExoticComponent<
      ComponentProps<"button"> & MotionProps & RefAttributes<HTMLButtonElement>
    >;
    a: ForwardRefExoticComponent<
      ComponentProps<"a"> & MotionProps & RefAttributes<HTMLAnchorElement>
    >;
    img: ForwardRefExoticComponent<
      ComponentProps<"img"> & MotionProps & RefAttributes<HTMLImageElement>
    >;
    ul: ForwardRefExoticComponent<
      ComponentProps<"ul"> & MotionProps & RefAttributes<HTMLUListElement>
    >;
    li: ForwardRefExoticComponent<
      ComponentProps<"li"> & MotionProps & RefAttributes<HTMLLIElement>
    >;
    tr: ForwardRefExoticComponent<
      ComponentProps<"tr"> & MotionProps & RefAttributes<HTMLTableRowElement>
    >;
    td: ForwardRefExoticComponent<
      ComponentProps<"td"> &
        MotionProps &
        RefAttributes<HTMLTableDataCellElement>
    >;
    th: ForwardRefExoticComponent<
      ComponentProps<"th"> &
        MotionProps &
        RefAttributes<HTMLTableHeaderCellElement>
    >;
    table: ForwardRefExoticComponent<
      ComponentProps<"table"> & MotionProps & RefAttributes<HTMLTableElement>
    >;
    section: ForwardRefExoticComponent<
      ComponentProps<"section"> & MotionProps & RefAttributes<HTMLElement>
    >;
    article: ForwardRefExoticComponent<
      ComponentProps<"article"> & MotionProps & RefAttributes<HTMLElement>
    >;
    header: ForwardRefExoticComponent<
      ComponentProps<"header"> & MotionProps & RefAttributes<HTMLElement>
    >;
    footer: ForwardRefExoticComponent<
      ComponentProps<"footer"> & MotionProps & RefAttributes<HTMLElement>
    >;
    nav: ForwardRefExoticComponent<
      ComponentProps<"nav"> & MotionProps & RefAttributes<HTMLElement>
    >;
    form: ForwardRefExoticComponent<
      ComponentProps<"form"> & MotionProps & RefAttributes<HTMLFormElement>
    >;
    input: ForwardRefExoticComponent<
      ComponentProps<"input"> & MotionProps & RefAttributes<HTMLInputElement>
    >;
    textarea: ForwardRefExoticComponent<
      ComponentProps<"textarea"> &
        MotionProps &
        RefAttributes<HTMLTextAreaElement>
    >;
    select: ForwardRefExoticComponent<
      ComponentProps<"select"> & MotionProps & RefAttributes<HTMLSelectElement>
    >;
    svg: ForwardRefExoticComponent<
      ComponentProps<"svg"> & MotionProps & RefAttributes<SVGSVGElement>
    >;
    path: ForwardRefExoticComponent<
      ComponentProps<"path"> & MotionProps & RefAttributes<SVGPathElement>
    >;
    circle: ForwardRefExoticComponent<
      ComponentProps<"circle"> & MotionProps & RefAttributes<SVGCircleElement>
    >;
    rect: ForwardRefExoticComponent<
      ComponentProps<"rect"> & MotionProps & RefAttributes<SVGRectElement>
    >;
  };
  export interface AnimatePresenceProps {
    children?: React.ReactNode;
    initial?: boolean;
    onExitComplete?: () => void;
    exitBeforeEnter?: boolean;
    presenceAffectsLayout?: boolean;
    mode?: "sync" | "popLayout" | "wait";
  }
  export const AnimatePresence = React.FC<AnimatePresenceProps>;
  export * from "framer-motion";
}
