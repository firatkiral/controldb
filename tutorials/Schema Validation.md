
### Schema Validation

ControlDB supports schema validation for documents in a collection. This is done by passing a schema object to the collection constructor. 

```javascript
var userSchema = {
  name: {
    type: "String",
    required: true
  },
  age: "Number",
};

var users = db.addCollection('users', {schema: userSchema});

users.insert({
  name: 'Odin',
  age: "50",
});
// Error: age: input must be of type "Number".

```

The schema object is an object with keys corresponding to the properties of the documents in the collection. The value of each key is an object with the following properties:

**type** : The type of the property. The following types are supported:

  * "String" :

    ```javascript
    {
      name: "String"
    }
    ```

  * "Number"

    ```javascript
    {
      age: "Number"
    }
    ```

  * "Boolean"

    ```javascript
    {
      isAlive: "Boolean"
    }
    ```

  * Array : An array of values of the specified type.

    ```javascript
    {
      tags: ["String"]
    }
    ```

  * Object : The object can have a nested schema. The nested schema is specified in the properties property of the object.

    ```javascript
    {
      address: {
        type: "Object",
        schema: {
          street: "String",
          city: "String",
          state: "String",
          zip: "Number"
        }
      }
    }
    ```

Schema objects can be defined in the following ways:

```javascript
  {
    key: type,
    key: {type, required, default, min, max, enum, ...},
  }
```

**required** : Boolean indicating whether the property is required. If true, the property must be present in the document. If false, the property is optional. If not specified, the property is optional.

**default** : The default value for the property. If the property is not present in the document, the default value will be used. If not specified, the default value is undefined.

**min** : The minimum value for the property. If the property is a number, the value must be greater than or equal to min. If the property is a string, the length of the string must be greater than or equal to min. If the property is an array, the length of the array must be greater than or equal to min. If the property is an object, the number of keys in the object must be greater than or equal to min. If not specified, there is no minimum value.

**max** : The maximum value for the property. If the property is a number, the value must be less than or equal to max. If the property is a string, the length of the string must be less than or equal to max. If the property is an array, the length of the array must be less than or equal to max. If the property is an object, the number of keys in the object must be less than or equal to max. If not specified, there is no maximum value.

**minLength** : The minimum length of the property. If the property is a string, the length of the string must be greater than or equal to minLength. If the property is an array, the length of the array must be greater than or equal to minLength. If the property is an object, the number of keys in the object must be greater than or equal to minLength. If not specified, there is no minimum length.

**maxLength** : The maximum length of the property. If the property is a string, the length of the string must be less than or equal to maxLength. If the property is an array, the length of the array must be less than or equal to maxLength. If the property is an object, the number of keys in the object must be less than or equal to maxLength. If not specified, there is no maximum length.

**enum** : An array of values that the property can take. If the property is not present in the document, the default value will be used. If not specified, the default value is undefined.

```javascript
{
  visibility: {
    type: "String",
    enum: {'private', 'public', 'friends'},
    default: "public",
  }
}
```

**validation**: A function that validates the property. The function takes the value of the property as an argument and returns true if the value is valid and false if the value is invalid.

```javascript
{
  name: {
    type: "String",
    validation: function(value) {
      return /^[a-zA-Z0-9-]{5,40}$/.test(v);
    }
  }
  tags: {
    type: ["String"],
    validation: function(value) {
      // Returns true if the value is valid or error message if the value is invalid.
      return value.length <= 5 || "Maximum 5 tags.";
    }
  }
}
```

**properties** : The schema object can be nested by setting the type of the key to Object and specifying properties property. The following example shows a schema for a document with nested properties:

```javascript
{
  address: {
    type: "Object",
    required: true,
    properties: {
      street: "String",
      city: {
        type: "String",
        required: true
      },
      postalCode: {
        type: "String",
        required: true,
        minLength: 5,
        maxLength: 10
      }
    }
  }
}
```
