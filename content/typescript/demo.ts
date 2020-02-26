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