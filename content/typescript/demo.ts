type FunctionWithMappedArgument<P extends { [key: string]: any }> = (args: P) => any;
type DestructuredArguments<F extends FunctionWithMappedArgument<any>> = F extends FunctionWithMappedArgument<infer R> ? R : never;

declare function drawPoint(config: { x: number, y: number, color: string}): any;
const args: DestructuredArguments<typeof drawPoint> = {
    x: 4,
    y: 6,
    
}


interface IUser {
    name: string;
    id: number;
    address: string;
    // ...
}

function getNames(userList: IUser[], id: number): string;
function getNames(userList: IUser[], id: number[]): string[];
function getNames(userList: IUser[], id: number | number[]): string | string[]{
    if (Array.isArray(id)) {
      const names: string[] = [];
      userList.forEach((user: IUser) => {
        if (id.includes(user.id)) {
          names.push(user.name);
        }
      })
      return names;
    }
    const found = userList.find((user: IUser) => user.id === id);
    if (found) {
      return found.name;
    } else {
      return ''
    }
  }
  
  const users: IUser[] = [
    {name: 'John', id: 1, address: ''},
    {name: 'Joi', id: 2, address: ''},
    {name: 'Kevin', id: 3, address: ''}
  ]
  
  const John = getNames(users, 1);
  const JohnAndKevin = getNames(users, [1, 3]);

const A = [1, '2', 3]
const str: string = A.reduce<string>((str, a) => `${str} ${a.toString()}`, '')

// assets modifier in typescript.
function f1(n: string | number): string {
  if (typeof n === 'number') {
    return n;
  }
  // asserts
  return n.toUppercase();
}

const toUpper = str => {
  return str.toUppercase();
}

const toUpper3 = (val: number | string) => {
  if (typeof val === 'number') {
      // ... 
  } else {
      return val.toUppercase();
  }
}

class Animal {
  public run() {}
}

class Dog extends Animal {
  public swim() {}
}

class Cat extends Animal {
  public meow() {}
}

// type NonNullable<T> = T extends null | undefined ? never : T;

function isCat(lucky: Dog | Cat): lucky is Cat {
  return lucky.hasOwnProperty('meow');
}

function assert(value: unknown, message?: string): asserts value {
  if (!value) {
      throw new Error(message);
  }
}

function assertNonNull<T>(obj: T): asserts obj is NonNullable<T>{}

function assertNumberArray(value: unknown): asserts value is number[] {
  if (!((value as any[]).every(item => typeof item === 'number'))) {
    throw new Error();
  }
}

function f11(n: number | string): number {
  assert(typeof n === 'string');
  return n.length; // 执行到这里 n 一定是 string 类型。
}

function f12(n: unknown) {
  assertNumberArray(n);
  return n[0] ** 2; // n => number[]
}

function f13(n: null | string) {
  assertNonNull(n);
  return n.length; // n -> string
}


declare function isArrayNumber(n: unknown): n is number[];
function f16(n: unknown) {
  if (!isArrayNumber(n)) {
    throw new Error();
  };
  return n[0] ** 2;
}