use serde_json::{from_str, Value};

use std::env::var;
use std::fs::File;
use std::io::prelude::Read;

lazy_static! {
    static ref PROFILE_STORE: String =
        var("DT_PROFILE_STORE").unwrap_or_else(|_| String::from("/tmp/profiles.json"));
}

pub fn read_profiles() -> Result<Value, String> {
    let mut f = File::open(PROFILE_STORE.as_str()).map_err(|e| format!("file not found: {}", e))?;
    let mut contents = String::new();
    f.read_to_string(&mut contents)
        .map_err(|e| format!("unable to read file: {}", e))?;
    from_str(&contents).map_err(|e| format!("unable to load json: {}", e))
}
