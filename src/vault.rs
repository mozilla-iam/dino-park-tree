use serde_json::{from_str, Value};

use std::fs::File;
use std::io::prelude::Read;

static PROFILE_STORE: &'static str = "/tmp/profiles.json";

pub fn read_profiles() -> Result<Value, String> {
    let mut f = File::open(PROFILE_STORE).map_err(|e| format!("file not found: {}", e))?;
    let mut contents = String::new();
    f.read_to_string(&mut contents)
        .map_err(|e| format!("unable to read file: {}", e))?;
    from_str(&contents).map_err(|e| format!("unable to load json: {}", e))
}
