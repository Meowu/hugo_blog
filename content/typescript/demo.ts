type FunctionWithMappedArgument<P extends { [key: string]: any }> = (args: P) => any;
type DestructuredArguments<F extends FunctionWithMappedArgument<any>> = F extends FunctionWithMappedArgument<infer R> ? R : never;

declare function drawPoint(config: { x: number, y: number, color: string}): any;
const args: DestructuredArguments<typeof drawPoint> = {
    x: 4,
    y: 6,
    
}