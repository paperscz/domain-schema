import Debug from 'debug';
import DomainSchema from 'domain-schema';

const debug = Debug('domain-graphql');

export default class {
  constructor() {}

  public generateTypes(schema, options: any = {}) {
    const domainSchema = new DomainSchema(schema);
    options.deep = options.deep || true;

    return this._generateTypes(domainSchema, options, [], []);
  }

  public _generateField(field, value, options, results, seen) {
    let result = '';
    switch (value.type.name) {
      case 'Boolean':
        result += 'Boolean';
        break;
      case 'ID':
        result += 'ID';
        break;
      case 'Integer':
        result += 'Int';
        break;
      case 'Float':
        result += 'Float';
        break;
      case 'String':
        result += 'String';
        break;
      default:
        if (value.type.isSchema) {
          result += value.type.name;
          if (options.deep && !value.external) {
            this._generateTypes(value.type, options, results, seen);
          }
        } else if (value.type.constructor === Array) {
          result += `[${this._generateField(field + '[]', { ...value, type: value.type[0] }, options, results, seen)}]`;
        } else {
          throw new Error(`Don't know how to handle type ${value.type.name} of ${field}`);
        }
    }

    if (!value.optional) {
      result += '!';
    }

    return result;
  }

  private _generateTypes(schema, options, results, seen) {
    if (seen.indexOf(schema.name) >= 0 || schema.__.exclude) {
      return;
    }
    seen.push(schema.name);
    let result = `type ${schema.name} {\n`;
    for (const key of schema.keys()) {
      const value = schema.values[key];
      if (!value.private) {
        result += `  ${key}: ` + this._generateField(schema.name + '.' + key, value, options, results, seen) + '\n';
      }
    }

    result += '}';
    results.push(result);

    debug(results.join('\n'));

    return results.join('\n\n');
  }
}
