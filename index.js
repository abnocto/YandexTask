const MyForm = (function(){

  const FORM_ID          = "myForm";   
  const RES_CONTAINER_ID = "resultContainer";

  const INPUT_NAMES = [ "fio", "email", "phone" ];

  const REQUEST_URLS = [ "success.json", "error.json", "progress.json" ];

  const SUCCESS  = 'success';
  const PROGRESS = 'progress';
  const ERROR    = 'error';

  const MSG_SUCCESS = 'Success';

  const FIO_REGEXP   = /\s+/;
  const FIO_LIMIT = 3;

  //from yandex mail user login rules
  const EMAIL_REGEXP = /^[a-zA-Z][a-zA-Z0-9\-\.]{1,28}[a-zA-Z0-9]@(ya\.ru|yandex\.(ru|ua|by|kz|com))$/;

  const PHONE_REGEXP_1 = /^\+7\(\d{3}\)\d{3}-\d{2}-\d{2}$/;
  const PHONE_REGEXP_2 = /[^\d]/g;
  const PHONE_LIMIT  = 30;

  const VALIDATORS = {

    fio : [ 
      function() {
        return this.getValue().split( FIO_REGEXP ).length === FIO_LIMIT;
      }
    ],

    email : [
      function() {         
        return EMAIL_REGEXP.test( this.getValue() );
      }
    ],


    phone : [
      function() { 
        return PHONE_REGEXP_1.test( this.getValue() );
      },
      function() {
        return this.getValue().replace( PHONE_REGEXP_2, '' ).split('').reduce( (s,e) => +e + s, 0) <= PHONE_LIMIT;
      }
    ]

  }

  const FORM = document.getElementById( FORM_ID );  

  const INPUTS = INPUT_NAMES.map( name => 
    ({
      name,
      element : FORM.querySelector(`input[name=${name}]`),
      isValid : function () {
        return !VALIDATORS[name] || VALIDATORS[name].every( validator => validator.call( this ) );
      },
      getValue : function() {
        return this.element.value.trim();
      },
      setValue : function( value ) {
        this.element.value = value;
      },
      setError : function() {
        this.element.classList.add( ERROR );
      },
      removeError : function() {
        this.element.classList.remove( ERROR );
      }
    })
  ); 

  const SUBMIT_BTN = FORM.querySelector('input[type=submit]');

  const RES_CONTAINER = document.getElementById( RES_CONTAINER_ID );  

  const validate = function() {
    const errorFields = INPUTS.filter( input => !input.isValid() ).map( input => input.name );
    const isValid = !errorFields.length;
    return { isValid, errorFields };
  };

  const submit = function() {
    INPUTS.forEach( input => input.removeError() );
    const validationResult = validate();
    if ( validationResult.isValid ) {      
      _doAjax();
    } else {
      INPUTS.forEach( input => {
        if ( validationResult.errorFields.includes( input.name ) ) {
          input.setError();
        }
      });
    }
  }; 

  const getData = function() {
    const data = {};
    INPUTS.forEach( input => data[input.name] = input.getValue() );
    return data;
  };

  const setData = function( obj ) {
    for ( let name in obj ) {
      const input = INPUTS.find( input => input.name === name );
      if ( input ) {
        input.setValue( obj[name] );
      }
    }
  };

  const _doAjax = function() {
    SUBMIT_BTN.setAttribute( "disabled", "disabled" );
    //get url from 'action' attr, or choose random url (success|error|progress) if 'action' wasn't set
    const url = FORM.getAttribute('action') || REQUEST_URLS[ Math.floor( Math.random() * REQUEST_URLS.length ) ];
    fetch( url )
      .then( res => res.json() )
      .then( obj => {        
        RES_CONTAINER.classList.remove( SUCCESS  );
        RES_CONTAINER.classList.remove( PROGRESS );
        RES_CONTAINER.classList.remove( ERROR    );
        switch ( obj.status ) {
          case SUCCESS:
            RES_CONTAINER.innerText = MSG_SUCCESS;
            RES_CONTAINER.classList.add( SUCCESS ); 
            SUBMIT_BTN.removeAttribute("disabled");         
            break;
          case PROGRESS:
            RES_CONTAINER.innerText = obj.timeout;
            RES_CONTAINER.classList.add( PROGRESS );
            _runTimeout( Date.now(), obj.timeout );
            break;
          case ERROR:
            RES_CONTAINER.innerText = obj.reason;
            RES_CONTAINER.classList.add( ERROR );
            SUBMIT_BTN.removeAttribute("disabled");
            break;
        }
      });
  };

  const _runTimeout = function( start, timeout ) {
    const diff = Date.now() - start;    
    if ( diff < timeout ) {
      RES_CONTAINER.innerText = timeout - diff;
      setTimeout( function() { 
        _runTimeout( start, timeout );
      }, 50 );
    } else {
      RES_CONTAINER.innerText = '';
      _doAjax();
    }
  };

  SUBMIT_BTN.addEventListener( 'click', e => {
    e.preventDefault();
    submit();
  });

  return { validate, submit, getData, setData };

})();