/*
Runtime Expressions
A runtime expression allows values to be defined based on information that will be available within an HTTP message, an event message, and within objects serialized from the Arazzo document such as workflows or steps.

The runtime expression is defined by the following ABNF syntax:

      expression = ( "$url" / "$method" / "$statusCode" / "$request." source / "$response." source / "$message." source / "$inputs." name / "$outputs." name / "$steps." name / "$workflows." name / "$sourceDescriptions." name / "$components." name / "$components.parameters." parameter-name)
      parameter-name = name ; Reuses 'name' rule for parameter names
      source = ( header-reference / query-reference / path-reference / body-reference )
      header-reference = "header." token
      query-reference = "query." name
      path-reference = "path." name
      body-reference = "body" ["#" json-pointer ]
      json-pointer    = *( "/" reference-token )
      reference-token = *( unescaped / escaped )
      unescaped       = %x00-2E / %x30-7D / %x7F-10FFFF
         ; %x2F ('/') and %x7E ('~') are excluded from 'unescaped'
      escaped         = "~" ( "0" / "1" )
        ; representing '~' and '/', respectively
      name = *( CHAR )
      token = 1*tchar
      tchar = "!" / "#" / "$" / "%" / "&" / "'" / "*" / "+" / "-" / "." /
        "^" / "_" / "`" / "|" / "~" / DIGIT / ALPHA
Examples
Source Location	example expression	notes
HTTP Method	$method	The allowable values for the $method will be those for the HTTP operation.
Requested media type	$request.header.accept	
Request parameter	$request.path.id	Request parameters MUST be declared in the parameters section of the parent operation or they cannot be evaluated. This includes request headers.
Request body property	$request.body#/user/uuid	In operations which accept payloads, references may be made to portions of the requestBody or the entire body.
Request URL	$url	
Response value	$response.body#/status	In operations which return payloads, references may be made to portions of the response body or the entire body.
Response header	$response.header.Server	Single header values only are available
workflow input	$inputs.username or $workflows.foo.inputs.username	Single input values only are available
Step output value	$steps.someStep.pets	In situations where the output named property return payloads, references may be made to portions of the response body or the entire body.
Workflow output value	$outputs.bar or $workflows.foo.outputs.bar	Single input values only are available
Components parameter	$components.parameters.foo	Accesses a foo parameter defined within the Components Object.
Runtime expressions preserve the type of the referenced value. Expressions can be embedded into string values by surrounding the expression with {} curly braces.
*/

